import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OrderMonthlyService } from './order-monthly.service';
import { MonthlyOrderSummaryResponse, OrderSummaryItemResponse } from '../../../shared/models/order-summary.model';
import { DepartmentService } from '../../system/department/department.service';
import { DepartmentResponse } from '../../../shared/models/department.model';
import { MonthlyMealDetailModalComponent } from './monthly-meal-detail-modal/monthly-meal-detail-modal.component';
import { UserService } from '../../system/user/user.service';
import { forkJoin } from 'rxjs';
import { FormatMoneyPipe } from '../../../shared/pipes/format-money.pipe';
import { ToastService } from '@core/services/toast.service';
import { FileDownloadService } from '@core/services/file-download.service';
import { EXCEL_FILE_NAMES, DEFAULT_PAGE_SIZE } from '@shared/constants/business.constants';

@Component({
  selector: 'app-order-monthly',
  standalone: true,
  imports: [CommonModule, FormsModule, MonthlyMealDetailModalComponent, FormatMoneyPipe],
  templateUrl: './order-monthly.component.html',
  styleUrls: ['./order-monthly.component.scss']
})
export class OrderMonthlyComponent implements OnInit {
  selectedMonth: number = new Date().getMonth() + 1;
  selectedYear: number = new Date().getFullYear();
  selectedDepartmentIds: number[] = [];
  selectedDepartmentId: number | null = null;
  isExporting: boolean = false;
  
  departments: DepartmentResponse[] = [];
  summary?: MonthlyOrderSummaryResponse;
  
  viewMode: 'overview' | 'list' = 'overview';
  
  // Daily overview data
  daysInMonth: { day: number | null, date: Date | null, totalMeals: number, isPadding: boolean, isWeekend: boolean }[] = [];
  
  // List View Pagination
  currentPage: number = 1;
  pageSize: number = DEFAULT_PAGE_SIZE;
  totalItems: number = 0;
  items: any[] = [];
  allMergedItems: any[] = [];
  sizeOptions = [10, 20, 50, 100];
  
  // Modal state
  isModalOpen: boolean = false;
  selectedUserId?: number;
  selectedUserName?: string;
  selectedUserTotalMeals: number = 0;

  months = Array.from({length: 12}, (_, i) => i + 1);
  years = [this.selectedYear - 1, this.selectedYear, this.selectedYear + 1];

  setViewMode(mode: 'overview' | 'list'): void {
    this.viewMode = mode;
  }

  constructor(
    private orderMonthlyService: OrderMonthlyService,
    private departmentService: DepartmentService,
    private userService: UserService,
    private router: Router,
    private toastService: ToastService,
    private fileDownloadService: FileDownloadService
  ) {}

  ngOnInit(): void {
    this.loadDepartments();
    this.fetchData();
  }

  loadDepartments(): void {
    this.departmentService.getAllDepartments().subscribe({
      next: (res) => {
        this.departments = res.result || [];
      }
    });
  }

  onFilterChange(): void {
    this.selectedDepartmentIds = this.selectedDepartmentId ? [this.selectedDepartmentId] : [];
    this.currentPage = 1;
    this.fetchData();
  }

  fetchData(): void {
    const deptId = this.selectedDepartmentId !== null ? this.selectedDepartmentId : undefined;
    forkJoin({
      summaryRes: this.orderMonthlyService.getMonthlySummary(this.selectedMonth, this.selectedYear, deptId),
      usersRes: this.userService.getAll()
    }).subscribe({
      next: (res) => {
        this.summary = res.summaryRes.result;
        let allUsers = res.usersRes.result || [];
        let fetchedItems = this.summary?.items || [];
        
        let mergedItems = allUsers.map(user => {
          let item = fetchedItems.find(i => i.userId === user.id);
          let dept = this.departments.find(d => d.name === user.department);
          
          return {
            userId: user.id,
            fullName: user.fullName,
            departmentName: user.department || '',
            departmentId: dept?.id,
            normalMealCount: item ? item.normalMealCount : 0,
            specialMealCount: item ? item.specialMealCount : 0,
            totalAmount: item ? item.totalAmount : 0,
            hasData: !!item
          };
        });

        if (this.selectedDepartmentIds && this.selectedDepartmentIds.length > 0) {
          mergedItems = mergedItems.filter(o => o.departmentId && this.selectedDepartmentIds.includes(o.departmentId));
        }

        this.allMergedItems = mergedItems;
        this.totalItems = mergedItems.length;
        this.updateListView();
        this.generateCalendarGrid();
      }
    });
  }

  updateListView(): void {
    this.items = this.allMergedItems.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize);
  }

  generateCalendarGrid(): void {
    const daysInMonthCount = new Date(this.selectedYear, this.selectedMonth, 0).getDate();
    
    // Calculate weekday of the 1st day of the month (0 = Sunday, 1 = Monday, ...)
    const firstDayOfMonth = new Date(this.selectedYear, this.selectedMonth - 1, 1).getDay();
    // Week starts on Monday (1), so if first day is Sunday (0), offset is 6.
    // If first day is Monday (1), offset is 0.
    const offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    
    // Khởi tạo mảng mới hoàn toàn để ép Change Detection cập nhật đúng dữ liệu
    const newCalendarGrid: { day: number | null, date: Date | null, totalMeals: number, isPadding: boolean, isWeekend: boolean }[] = [];
    
    // Thêm các ô trống đầu tháng (padding)
    for (let i = 0; i < offset; i++) {
      newCalendarGrid.push({ day: null, date: null, totalMeals: 0, isPadding: true, isWeekend: false });
    }

    for (let i = 1; i <= daysInMonthCount; i++) {
      const date = new Date(this.selectedYear, this.selectedMonth - 1, i);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      newCalendarGrid.push({
        day: i,
        date: date,
        totalMeals: 0,
        isPadding: false,
        isWeekend: isWeekend
      });
    }

    if (this.summary && this.summary.dailyCounts) {
      this.summary.dailyCounts.forEach((d: any) => {
        let y, m, dNum;
        if (Array.isArray(d.date)) {
          y = d.date[0];
          m = d.date[1];
          dNum = d.date[2];
        } else {
          const parts = d.date.split('-');
          y = parseInt(parts[0], 10);
          m = parseInt(parts[1], 10);
          dNum = parseInt(parts[2], 10);
        }
        
        if (y === this.selectedYear && m === this.selectedMonth) {
          const cell = newCalendarGrid.find(c => c.day === dNum);
          if (cell) {
             cell.totalMeals = d.totalMeals;
          }
        }
      });
    }
    
    // Gán lại reference mới cho biến template binding
    this.daysInMonth = [...newCalendarGrid];
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.updateListView();
  }

  onSizeChange(newSize: any): void {
    const sizeNum = Number(newSize);
    if (sizeNum !== this.pageSize) {
      this.pageSize = sizeNum;
      this.currentPage = 1;
      this.updateListView();
    }
  }

  get startItem(): number {
    if (this.totalItems === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    const end = this.currentPage * this.pageSize;
    return end > this.totalItems ? this.totalItems : end;
  }

  get totalPagesCount(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  openUserDetail(item: OrderSummaryItemResponse): void {
    this.selectedUserId = item.userId;
    this.selectedUserName = item.fullName;
    this.selectedUserTotalMeals = item.normalMealCount + item.specialMealCount;
    this.isModalOpen = true;
  }

  goToDailyDetail(date: Date | null): void {
    if (!date) return;
    
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${yyyy}-${mm}-${dd}`;
    
    this.router.navigate(['/statistic/order-daily'], { queryParams: { date: formattedDate } });
  }

  exportExcel(): void {
    this.isExporting = true;
    const deptId = this.selectedDepartmentId !== null ? this.selectedDepartmentId : undefined;
    
    this.orderMonthlyService.exportMonthlyExcel(this.selectedMonth, this.selectedYear, deptId).subscribe({
      next: (blob) => {
        this.fileDownloadService.save(blob, EXCEL_FILE_NAMES.MONTHLY_ORDER_TRACKING(this.selectedMonth, this.selectedYear));
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
