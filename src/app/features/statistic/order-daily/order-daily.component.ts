import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { OrderDailyService } from './order-daily.service';
import { DailyOrderSummaryResponse } from '@shared/models/order-summary.model';
import { OrderResponse } from '@shared/models/order.model';
import { DepartmentService } from '@features/system/department/department.service';
import { DepartmentResponse } from '@shared/models/department.model';
import { UserService } from '@features/system/user/user.service';
import { GuestMealService } from '@features/system/guest-meal/guest-meal.service';
import { GuestMealResponse } from '@shared/models/guest-meal.model';
import { GUEST_ROW_NAME, MAX_GUEST_MEAL_ROWS } from '@shared/constants/guest-meal.constants';
import { forkJoin } from 'rxjs';
import { FormatMoneyPipe } from '@shared/pipes/format-money.pipe';
import { ToastService } from '@shared/services/toast.service';
import { FileDownloadService } from '@core/services/file-download.service';
import { EXCEL_FILE_NAMES, DEFAULT_PAGE_SIZE, APP_DATE_TIME_FORMAT } from '@shared/constants/business.constants';
import { toIsoDate } from '@shared/utils/date.util';
import { PageItem, buildPageItems } from '@shared/utils/pagination.util';
import { SortState, sortByText } from '@shared/utils/sort.util';
import { SortHeaderComponent } from '@shared/components/crud/sort-header.component';

@Component({
  selector: 'app-order-daily',
  standalone: true,
  imports: [CommonModule, FormsModule, FormatMoneyPipe, SortHeaderComponent],
  templateUrl: './order-daily.component.html',
  styleUrls: ['./order-daily.component.scss']
})
export class OrderDailyComponent implements OnInit {
  readonly dateTimeFormat = APP_DATE_TIME_FORMAT;
  selectedDate: string = toIsoDate(new Date());
  selectedDepartmentId: number | null = null;
  selectedStatus: string | null = null;
  isExporting: boolean = false;
  isFriday: boolean = false;
  totalNormalMeals: number = 0;
  totalSpecialMeals: number = 0;
  
  departments: DepartmentResponse[] = [];
  summary?: DailyOrderSummaryResponse;
  orders: any[] = [];
  
  currentPage: number = 1;
  pageSize: number = DEFAULT_PAGE_SIZE;
  totalOrders: number = 0;
  sizeOptions = [10, 20, 50, 100];
  sort: SortState | null = null;

  constructor(
    private orderDailyService: OrderDailyService,
    private departmentService: DepartmentService,
    private userService: UserService,
    private guestMealService: GuestMealService,
    private route: ActivatedRoute,
    private toastService: ToastService,
    private fileDownloadService: FileDownloadService
  ) {}

  ngOnInit(): void {
    this.loadDepartments();
    
    this.route.queryParams.subscribe(params => {
      if (params['date']) {
        this.selectedDate = params['date'];
      }
      this.fetchData();
    });
  }

  loadDepartments(): void {
    this.departmentService.getAllDepartments().subscribe({
      next: (res) => {
        this.departments = res.result || [];
      }
    });
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.fetchData();
  }

  getLogicalStatus(dbStatus: string | undefined): 'REGISTERED' | 'UNREGISTERED' {
    if (!dbStatus) return 'UNREGISTERED';
    const registeredStatuses = ['PENDING', 'CONFIRMED', 'ON_MARKET', 'PRINTED'];
    if (registeredStatuses.includes(dbStatus)) {
      return 'REGISTERED';
    }
    return 'UNREGISTERED';
  }

  fetchData(): void {
    forkJoin({
      ordersRes: this.orderDailyService.getAdminOrders(this.selectedDate, undefined),
      usersRes: this.userService.getAll(),
      guestRes: this.guestMealService.getGuestMeals(1, MAX_GUEST_MEAL_ROWS, {
        startDate: this.selectedDate,
        endDate: this.selectedDate
      })
    }).subscribe({
      next: (res) => {
        let fetchedOrders = res.ordersRes.result?.orders || [];
        let allUsers = res.usersRes.result || [];

        let mergedList = allUsers.map(user => {
          let userOrder = fetchedOrders.find(o => o.userId === user.id);
          let logicalStatus = this.getLogicalStatus(userOrder?.status);
          
          let dept = this.departments.find(d => d.name === user.department);
          
          return {
            ...userOrder,
            userId: user.id,
            userName: user.username,
            fullName: user.fullName,
            departmentName: user.department || '',
            departmentId: dept?.id,
            logicalStatus: logicalStatus,
            originalStatus: userOrder?.status,
            createdAt: userOrder?.createdAt 
          };
        });

        mergedList = mergedList.concat(this.buildGuestRows(res.guestRes.result?.data || []));

        if (this.selectedDepartmentId !== null) {
          mergedList = mergedList.filter(o => o.departmentId === this.selectedDepartmentId);
        }
        
        if (this.selectedStatus !== null) {
          mergedList = mergedList.filter(o => o.logicalStatus === this.selectedStatus);
        }
        
        this.calculateSummary(mergedList);

        mergedList = sortByText(mergedList, this.sort);

        this.totalOrders = mergedList.length;
        this.orders = mergedList.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize).map(order => {
           if (Array.isArray(order.createdAt)) {
             const [y, m, d, hh = 0, mm = 0, ss = 0] = order.createdAt as any;
             order.createdAt = `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}T${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
           }
           return order;
        });
      }
    });
  }

  buildGuestRows(guestMeals: GuestMealResponse[]): any[] {
    const rowsByDepartment = new Map<string, any>();

    guestMeals.forEach(meal => {
      const key = meal.departmentName || '';
      const row = rowsByDepartment.get(key) ?? {
        userId: null,
        userName: '',
        fullName: GUEST_ROW_NAME,
        departmentName: key,
        departmentId: meal.departmentId,
        logicalStatus: 'REGISTERED',
        isGuest: true,
        normalQuantity: 0,
        specialQuantity: 0,
        totalAmount: 0
      };

      row.normalQuantity += meal.normalQuantity;
      row.specialQuantity += meal.specialQuantity;
      row.totalAmount += meal.totalAmount;
      rowsByDepartment.set(key, row);
    });

    return Array.from(rowsByDepartment.values());
  }

  calculateSummary(list: any[]): void {
    const registered = list.filter(o => o.logicalStatus === 'REGISTERED');
    let totalNormal = 0;
    let totalSpecial = 0;
    let totalAmount = 0;

    this.isFriday = new Date(this.selectedDate).getDay() === 5;

    registered.forEach(o => {
      if (o.isGuest) {
        totalNormal += o.normalQuantity;
        totalSpecial += o.specialQuantity;
        totalAmount += o.totalAmount;
        return;
      }

      if (o.isSpecial) {
        totalSpecial++;
      } else {
        totalNormal++;
      }
      totalAmount += o.price || 0;
    });

    if (this.isFriday) {
      this.totalNormalMeals = totalNormal;
      this.totalSpecialMeals = totalSpecial;
    } else {
      this.totalNormalMeals = 0;
      this.totalSpecialMeals = 0;
    }

    this.summary = {
      date: this.selectedDate,
      totalNormalMeals: totalNormal,
      totalSpecialMeals: totalSpecial,
      totalAmount: totalAmount,
      items: []
    } as any;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.fetchData();
  }

  onSortChange(sort: SortState): void {
    this.sort = sort;
    this.currentPage = 1;
    this.fetchData();
  }

  get totalPages(): number[] {
    return Array(Math.ceil(this.totalOrders / this.pageSize)).fill(0).map((x, i) => i + 1);
  }

  get startItem(): number {
    if (this.totalOrders === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    const end = this.currentPage * this.pageSize;
    return end > this.totalOrders ? this.totalOrders : end;
  }

  get totalPagesCount(): number {
    return Math.ceil(this.totalOrders / this.pageSize);
  }

  get pageItems(): PageItem[] {
    return buildPageItems(this.currentPage, this.totalPagesCount);
  }

  onSizeChange(newSize: any): void {
    const sizeNum = Number(newSize);
    if (sizeNum !== this.pageSize) {
      this.pageSize = sizeNum;
      this.currentPage = 1;
      this.fetchData();
    }
  }

  exportExcel(): void {
    this.isExporting = true;
    const dateToExport = this.selectedDate;
    const departmentToExport = this.selectedDepartmentId !== null ? this.selectedDepartmentId : undefined;
    
    this.orderDailyService.exportDailyExcel(dateToExport, departmentToExport).subscribe({
      next: (blob) => {
        const dateParts = dateToExport.split('-');
        const formattedDate = dateParts.length === 3 ? `${dateParts[2]}_${dateParts[1]}_${dateParts[0]}` : dateToExport;
        this.fileDownloadService.save(blob, EXCEL_FILE_NAMES.DAILY_ORDER_SUMMARY(formattedDate));
        this.toastService.showSuccess('Tải file Excel thành công!');
        this.isExporting = false;
      },
      error: (err) => {
        console.error('Export error', err);
        this.toastService.showError('Có lỗi xảy ra khi xuất Excel.');
        this.isExporting = false;
      }
    });
  }
}
