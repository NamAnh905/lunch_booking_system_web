import { Component, OnInit, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CanComponentDeactivate } from '@core/guards/pending-changes-guard';
import { MealOrderService } from './meal-order.service';
import { AuthService } from '@core/auth/auth.service';
import { OrderResponse } from '@shared/models';
import Swal from 'sweetalert2';

import { CalendarDay } from '@shared/models/meal-order.model';
import { FormatMoneyPipe } from '../../../shared/pipes/format-money.pipe';
import { MoneyShortPipe } from '@shared/pipes/money-short.pipe';
import { MealCalendarService } from './services/meal-calendar.service';
import { MealSummaryCalculator } from './services/meal-summary.calculator';
import { WeeklyMenuGridBuilder } from './services/weekly-menu-grid.builder';
import { MealOrderFacade } from './meal-order.facade';
import { MEAL_PRICE, SWAL_COLORS } from '@shared/constants/business.constants';
import { BusinessConfigService, formatVnTime } from '@shared/services/business-config.service';
import { OrderStatus } from '@shared/enums';
import { MenuType } from '@shared/enums/menu-type.enum';
import { toIsoDate, getWeekRange } from '@shared/utils/date.util';

@Component({
  selector: 'app-meal-order',
  standalone: true,
  imports: [CommonModule, RouterModule, FormatMoneyPipe],
  templateUrl: './meal-order.component.html',
  styleUrl: './meal-order.component.scss',
  providers: [MealOrderFacade]
})
export class MealOrderComponent implements OnInit, CanComponentDeactivate {
  private mealOrderService = inject(MealOrderService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private calendarService = inject(MealCalendarService);
  private summaryCalculator = inject(MealSummaryCalculator);
  private menuGridBuilder = inject(WeeklyMenuGridBuilder);
  private facade = inject(MealOrderFacade);
  private businessConfig = inject(BusinessConfigService);
  private moneyShort = new MoneyShortPipe();

  get cutOffTimeLabel(): string {
    return formatVnTime(this.businessConfig.cutOffTime);
  }

  // Calendar State - khởi tạo theo ngày hiện tại của hệ thống.
  selectedDay = new Date().getDate();
  currentMonth = new Date().getMonth(); // 0-indexed
  currentYear = new Date().getFullYear();

  pricePerMeal: number = MEAL_PRICE.NORMAL;
  specialPricePerMeal: number = MEAL_PRICE.SPECIAL;
  totalDaysEat = 0;
  totalDaysSpecial = 0;
  totalPrice = 0;

  calendarDays: CalendarDay[] = [];
  calendarRows: CalendarDay[][] = [];
  registeredDates: Set<string> = new Set<string>(); // Set of date strings 'YYYY-MM-DD'

  // Real backend maps
  menuMap: Record<string, any> = {};
  orderMap: Record<string, OrderResponse> = {};
  originalOrders: OrderResponse[] = [];

  /**
   * Ảnh chụp trạng thái đăng ký gốc từ backend: key = 'YYYY-MM-DD', value = có phải suất đặc biệt.
   * Ô nào có mặt trong map = đã đăng ký. Dùng để so sánh phát hiện thay đổi chưa lưu (dirty).
   */
  private originalState = new Map<string, boolean>();

  // UI State
  showMenuModal = false;
  menuGrid: { 
    priceName: string, 
    priceAmount: number, 
    maxDishes: number,
    dishRows: { dayDishes: string[] }[] 
  }[] = [];
  gridDays: { date: string, dayOfWeek: string }[] = [];
  // Thực đơn dạng ảnh (fallback khi tuần không có thực đơn dạng danh sách)
  menuImageUrl: string | null = null;
  menuImageName = '';
  isLoadingMenu = false;
  loading = false;
  toastMessage = '';
  toastType: 'success' | 'danger' = 'success';

  /** Ngày đại diện tháng đang xem — để hiển thị tên tháng qua DatePipe (bỏ mảng MONTH_NAMES cứng). */
  get headerDate(): Date {
    return new Date(this.currentYear, this.currentMonth, 1);
  }

  ngOnInit(): void {
    // Clear cache mỗi khi vào trang (tránh dùng dữ liệu cũ sau khi mua/bán vé).
    this.facade.clearCache();

    this.facade.loadPrices().subscribe((prices) => {
      this.pricePerMeal = prices.normal;
      this.specialPricePerMeal = prices.special;
      this.loadData();
    });
  }

  loadData(): void {
    this.loading = true;
    this.facade.loadMonth(this.currentYear, this.currentMonth).subscribe((data) => {
      this.originalOrders = data.orders;
      this.orderMap = data.orderMap;
      this.menuMap = data.menuMap;
      this.registeredDates = data.registeredDates;

      // Chụp lại trạng thái gốc để phát hiện thay đổi chưa lưu (dirty).
      this.originalState.clear();
      this.originalOrders.forEach((order) => {
        if (order.menuDate && order.status !== OrderStatus.CANCELLED) {
          const key = order.menuDate.toString().split('T')[0];
          this.originalState.set(key, order.isSpecial ?? false);
        }
      });

      this.setupCalendar();

      // Khôi phục cờ suất đặc biệt từ đơn trên backend sau khi dựng lịch.
      this.calendarDays.forEach((day) => {
        if (day.dayNumber && day.isRegistered && day.dateString) {
          const order = this.orderMap[day.dateString];
          if (order) {
            day.isSpecial = order.isSpecial ?? false;
          }
        }
      });

      this.updateSummary();
      this.loading = false;
    });
  }

  setupCalendar(): void {
    this.calendarDays = this.calendarService.buildCalendar({
      year: this.currentYear,
      month: this.currentMonth,
      registeredDates: this.registeredDates,
      orderMap: this.orderMap,
      menuMap: this.menuMap,
      currentUserId: this.authService.currentUserValue?.userId
    });
    this.calendarRows = this.calendarService.toRows(this.calendarDays);
    this.updateSummary();
  }

  updateSummary(): void {
    const summary = this.summaryCalculator.calculate(this.calendarDays, {
      normal: this.pricePerMeal,
      special: this.specialPricePerMeal
    });
    this.totalDaysEat = summary.totalDaysEat;
    this.totalDaysSpecial = summary.totalDaysSpecial;
    this.totalPrice = summary.totalPrice;
  }

  // Navigation arrows
  prevMonth(): void {
    this.confirmDiscardChanges().then((canLeave) => {
      if (!canLeave) return;
      if (this.currentMonth === 0) {
        this.currentMonth = 11;
        this.currentYear--;
      } else {
        this.currentMonth--;
      }
      this.selectedDay = 1; // Default to first day of new month
      this.loadData();
    });
  }

  nextMonth(): void {
    this.confirmDiscardChanges().then((canLeave) => {
      if (!canLeave) return;
      if (this.currentMonth === 11) {
        this.currentMonth = 0;
        this.currentYear++;
      } else {
        this.currentMonth++;
      }
      this.selectedDay = 1; // Default to first day of new month
      this.loadData();
    });
  }

  // Handle day circle click
  onDayClick(day: CalendarDay): void {
    if (!day.dayNumber || day.isDisabled) return;
    
    if (day.isPastOrCutoff) {
      this.showToast('Đã qua giờ chốt, không thể thay đổi!', 'danger');
      return;
    }

    this.selectedDay = day.dayNumber;

    // If user is toggling OFF (deselecting), handle immediately
    if (day.isRegistered) {
      day.isRegistered = false;
      day.isSpecial = false;
      this.registeredDates.delete(day.dateString);
      this.updateSummary();
      return;
    }

    // Check if this day is a Friday (getDay() === 5)
    const dateObj = new Date(day.dateString + 'T00:00:00');
    const isFriday = dateObj.getDay() === 5;

    if (isFriday) {
      // Show SweetAlert popup for Friday special meal choice
      Swal.fire({
        title: 'Chọn suất ăn ngày Thứ 6',
        text: 'Bạn muốn đăng ký suất thường hay suất đặc biệt?',
        icon: 'question',
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: `Suất đặc biệt (${this.moneyShort.transform(this.specialPricePerMeal)})`,
        denyButtonText: `Suất thường (${this.moneyShort.transform(this.pricePerMeal)})`,
        cancelButtonText: 'Hủy',
        confirmButtonColor: SWAL_COLORS.SPECIAL,
        denyButtonColor: SWAL_COLORS.NORMAL,
        allowOutsideClick: false
      }).then((result) => {
        if (result.isConfirmed) {
          // Special meal
          day.isRegistered = true;
          day.isSpecial = true;
          this.registeredDates.add(day.dateString);
          this.updateSummary();
        } else if (result.isDenied) {
          // Normal meal
          day.isRegistered = true;
          day.isSpecial = false;
          this.registeredDates.add(day.dateString);
          this.updateSummary();
        }
        // If cancelled, do nothing
      });
    } else {
      // Non-Friday: register as normal meal
      day.isRegistered = true;
      day.isSpecial = false;
      this.registeredDates.add(day.dateString);
      this.updateSummary();
    }
  }

  // Action Buttons

  /** Các ô hợp lệ có thể chọn/bỏ chọn trong tháng (bỏ qua ô trống, ngày bị khoá, ngày đã qua giờ chốt). */
  private getSelectableDays(): CalendarDay[] {
    return this.calendarDays.filter(d => d.dayNumber !== null && !d.isDisabled && !d.isPastOrCutoff);
  }

  /** True khi mọi ngày hợp lệ trong tháng đều đã được đăng ký (dùng để đổi text nút "Chọn tất cả"). */
  get isAllSelected(): boolean {
    const selectableDays = this.getSelectableDays();
    return selectableDays.length > 0 && selectableDays.every(d => d.isRegistered);
  }

  toggleSelectAll(): void {
    const activeSelectableDays = this.getSelectableDays();
    if (activeSelectableDays.length === 0) return;

    const allSelected = this.isAllSelected;

    activeSelectableDays.forEach(day => {
      if (allSelected) {
        day.isRegistered = false;
        day.isSpecial = false;
        this.registeredDates.delete(day.dateString);
      } else {
        day.isRegistered = true;
        this.registeredDates.add(day.dateString);
      }
    });

    this.updateSummary();
  }

  // Show detailed menu list of the current week
  viewMenu(): void {
    const { monday, start: startStr, end: endStr } = getWeekRange(new Date());

    this.showMenuModal = true;
    this.isLoadingMenu = true;
    this.menuGrid = [];
    this.gridDays = [];
    this.menuImageUrl = null;
    this.menuImageName = '';

    this.mealOrderService.getWeeklyMenus(startStr, endStr).subscribe({
      next: (res) => {
        const menus = res.result || [];
        this.buildMenuGrid(menus, monday);

        this.isLoadingMenu = false;
      },
      error: () => {
        this.isLoadingMenu = false;
        this.showToast('Không thể lấy thông tin thực đơn.', 'danger');
      }
    });
  }

  buildMenuGrid(menus: any[], monday: Date): void {
    const grid = this.menuGridBuilder.build(menus, monday);
    this.gridDays = grid.gridDays;
    this.menuGrid = grid.menuGrid;

    // Fallback: nếu tuần không có thực đơn dạng danh sách nhưng có thực đơn dạng ảnh,
    // hiển thị ảnh thay cho lưới.
    if (this.menuGrid.length === 0) {
      const imageMenu = menus.find((m) => m?.type === MenuType.IMAGE && m?.imageUrl);
      if (imageMenu) {
        this.menuImageUrl = imageMenu.imageUrl;
        this.menuImageName = imageMenu.name || '';
      }
    }
  }

  closeMenuModal(): void {
    this.showMenuModal = false;
  }

  goToTicketExchange(): void {
    this.router.navigate(['/portal/ticket-exchange']);
  }

  getSelectedDateString(): string {
    return toIsoDate(new Date(this.currentYear, this.currentMonth, this.selectedDay));
  }

  // Save Registration to Database
  saveRegistration(): void {
    // Ngày mới đăng ký (chưa có đơn hợp lệ trên backend), kèm cờ suất đặc biệt.
    const datesToRegister = Array.from(this.registeredDates)
      .filter((date) => !this.originalOrders.find((o) => o.menuDate === date && o.status !== OrderStatus.CANCELLED))
      .map((dateStr) => ({
        orderDate: dateStr,
        isSpecial: this.calendarDays.find((d) => d.dateString === dateStr)?.isSpecial ?? false
      }));

    // Đơn cần huỷ (đang có trên backend nhưng người dùng đã bỏ chọn).
    const ordersToCancel = this.originalOrders.filter(
      (order) => order.menuDate && order.status !== OrderStatus.CANCELLED && !this.registeredDates.has(order.menuDate)
    );

    if (datesToRegister.length === 0 && ordersToCancel.length === 0) {
      this.showToast('Không có thay đổi đăng ký nào cần lưu.', 'success');
      return;
    }

    this.loading = true;
    this.facade.save({ datesToRegister, ordersToCancel }).subscribe((result) => {
      this.facade.invalidateMonth(this.currentYear, this.currentMonth);
      this.showSaveResult(result.hasError);
    });
  }

  private showSaveResult(hasError: boolean): void {
    Swal.fire({
      icon: hasError ? 'error' : 'success',
      title: hasError ? 'Failed' : 'Successfully',
      text: hasError ? 'Đăng ký vé ăn không thành công' : 'Đăng ký ngày ăn thành công !',
      confirmButtonText: 'OK',
      confirmButtonColor: SWAL_COLORS.PRIMARY,
      allowOutsideClick: false
    }).then((result) => {
      if (result.isConfirmed) {
        this.loadData(); // Tải lại để làm mới mappings.
      }
    });
  }

  // ---- Bảo vệ thay đổi chưa lưu (unsaved changes) ----

  /** Một ô đang ở trạng thái nháp nếu trạng thái hiện tại khác với trạng thái gốc từ backend. */
  isDayDirty(day: CalendarDay): boolean {
    if (!day.dayNumber || !day.dateString) return false;

    const wasRegistered = this.originalState.has(day.dateString);
    const originalSpecial = this.originalState.get(day.dateString) ?? false;

    // Đổi giữa đăng ký / huỷ.
    if (day.isRegistered !== wasRegistered) return true;
    // Vẫn đăng ký nhưng đổi loại suất (thường <-> đặc biệt).
    if (day.isRegistered && (day.isSpecial ?? false) !== originalSpecial) return true;

    return false;
  }

  /** Còn thay đổi chưa lưu nếu có bất kỳ ô nào khác trạng thái gốc. */
  get hasUnsavedChanges(): boolean {
    return this.calendarDays.some((day) => this.isDayDirty(day));
  }

  /** Chặn F5 / đóng tab bằng hộp thoại cảnh báo mặc định của trình duyệt khi còn thay đổi chưa lưu. */
  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges) {
      event.preventDefault();
      event.returnValue = true; // Bắt buộc cho một số trình duyệt cũ để hiện cảnh báo.
    }
  }

  /** Guard CanDeactivate gọi hàm này khi điều hướng nội bộ Angular. */
  canDeactivate(): boolean | Promise<boolean> {
    return this.confirmDiscardChanges();
  }

  /**
   * Xác nhận bỏ thay đổi chưa lưu. Trả về true nếu được phép tiếp tục (không dirty hoặc user đồng ý rời).
   * Dùng chung cho guard CanDeactivate và chuyển tháng trong màn hình.
   */
  private confirmDiscardChanges(): Promise<boolean> {
    if (!this.hasUnsavedChanges) return Promise.resolve(true);

    return Swal.fire({
      title: 'Thay đổi chưa được lưu',
      text: 'Bạn có các đăng ký suất ăn chưa lưu. Bạn có chắc muốn rời đi mà không lưu?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Rời đi',
      cancelButtonText: 'Ở lại',
      confirmButtonColor: SWAL_COLORS.PRIMARY,
      cancelButtonColor: SWAL_COLORS.NORMAL,
      allowOutsideClick: false
    }).then((result) => result.isConfirmed);
  }

  showToast(message: string, type: 'success' | 'danger'): void {
    this.toastMessage = message;
    this.toastType = type;
    setTimeout(() => {
      this.toastMessage = '';
    }, 4000);
  }
}
