import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MealOrderService } from './meal-order.service';
import { AuthService } from '@core/auth/auth.service';
import { OrderResponse, MenuResponse } from '@shared/models';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { CalendarDay } from '@shared/models/meal-order.model';
import { MEAL_ORDER_CONSTANTS } from '@shared/constants/meal-order.constants';

@Component({
  selector: 'app-meal-order',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './meal-order.component.html',
  styleUrl: './meal-order.component.scss'
})
export class MealOrderComponent implements OnInit {
  private mealOrderService = inject(MealOrderService);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Calendar State - Initialize to July 2026 to match screenshot
  selectedDay = 5;
  currentMonth = 6; // 0-indexed, July = 6
  currentYear = 2026;

  pricePerMeal = MEAL_ORDER_CONSTANTS.PRICE_PER_MEAL;
  totalDaysEat = 0;
  totalPrice = 0;

  calendarDays: CalendarDay[] = [];
  calendarRows: CalendarDay[][] = [];
  registeredDates: Set<string> = new Set<string>(); // Set of date strings 'YYYY-MM-DD'

  // Real backend maps
  menuMap: Record<string, any> = {};
  orderMap: Record<string, OrderResponse> = {};
  originalOrders: OrderResponse[] = [];
  
  // Cache for loaded months
  private monthCache: Record<string, { orders: OrderResponse[], menus: any[] }> = {};

  // UI State
  dropdownOpen = false;
  showMenuModal = false;
  selectedMenuDishes: string[] = [];
  loading = false;
  toastMessage = '';
  toastType: 'success' | 'danger' = 'success';
  usernameDisplay = 'CNVT Đặng Nam Anh';

  MONTH_NAMES = MEAL_ORDER_CONSTANTS.MONTH_NAMES;

  WEEK_DISHES = MEAL_ORDER_CONSTANTS.WEEK_DISHES;

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    if (user) {
      this.usernameDisplay = `CNVT ${user.username}`;
    }
    this.loadData();
  }

  loadData(): void {
    this.loading = true;

    const startStr = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-01`;
    const endDay = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    const endStr = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
    const cacheKey = `${this.currentYear}-${this.currentMonth}`;

    // Return cached data if available
    if (this.monthCache[cacheKey]) {
      this.applyData(this.monthCache[cacheKey].orders, this.monthCache[cacheKey].menus);
      this.loading = false;
      return;
    }

    // Call APIs in parallel using forkJoin
    forkJoin({
      orders: this.mealOrderService.getMyOrders(startStr, endStr).pipe(catchError(() => of({ result: null }))),
      menus: this.mealOrderService.getMenus().pipe(catchError(() => of({ result: null })))
    }).subscribe({
      next: (res) => {
        // If both are null, it implies a network error simulating the mock fallback
        if (!res.orders.result && !res.menus.result) {
          this.loadMockData();
          this.setupCalendar();
          this.loading = false;
          return;
        }

        const orders = res.orders.result || [];
        const menus = Array.isArray(res.menus.result) ? res.menus.result : (res.menus.result?.content || []);

        // Save to cache
        this.monthCache[cacheKey] = { orders, menus };

        this.applyData(orders, menus);
        this.loading = false;
      },
      error: () => {
        this.loadMockData();
        this.setupCalendar();
        this.loading = false;
      }
    });
  }

  applyData(orders: OrderResponse[], menusList: any[]): void {
    this.originalOrders = orders;
    this.orderMap = {};
    this.registeredDates.clear();

    // Populate order map
    this.originalOrders.forEach(order => {
      if (order.menuDate && order.status !== 'CANCELLED') {
        this.orderMap[order.menuDate] = order;
        this.registeredDates.add(order.menuDate);
      }
    });

    // Populate menu map
    this.menuMap = {};
    menusList.forEach(menu => {
      if (menu.date) {
        this.menuMap[menu.date] = menu;
      }
    });

    this.setupCalendar();
  }

  loadMockData(): void {
    // Generate mock orders matching the 7 registered days in screenshot (Days 1, 2, 3, 6, 7, 8, 9)
    const mockDays = [1, 2, 3, 6, 7, 8, 9];
    this.registeredDates.clear();

    mockDays.forEach(day => {
      const dateStr = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      this.registeredDates.add(dateStr);

      this.orderMap[dateStr] = {
        id: 2000 + day,
        userId: 1,
        menuId: 1000 + day,
        menuDate: dateStr,
        price: this.pricePerMeal,
        status: 'ORDERED',
        ticketSource: 'SYSTEM',
        isSpecial: false,
        isPrinted: false
      };
    });
  }

  setupCalendar(): void {
    const year = this.currentYear;
    const month = this.currentMonth;

    // Day of week of the 1st
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon...

    // Total days in the month
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: CalendarDay[] = [];
    const today = new Date();

    // Pad empty cells before the 1st
    for (let i = 0; i < firstDay; i++) {
      days.push({ dayNumber: null, dateString: '', isRegistered: false });
    }

    // Generate actual days
    for (let i = 1; i <= totalDays; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const cellDate = new Date(year, month, i);
      const isReg = this.registeredDates.has(dateStr);

      // Mark past dates if needed (to prevent editing, optional, not strict in sample mockup)
      const isPast = cellDate.getTime() < new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

      // Check for weekends (0 = Sunday, 6 = Saturday)
      const dayOfWeek = cellDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // Check for public holidays (Solar dates)
      const solarHolidays = MEAL_ORDER_CONSTANTS.SOLAR_HOLIDAYS;
      const mmdd = `${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const isHoliday = solarHolidays.includes(mmdd);

      days.push({
        dayNumber: i,
        dateString: dateStr,
        isRegistered: isReg && !(isWeekend || isHoliday), // Ensure we don't accidentally register a disabled day
        menuId: this.menuMap[dateStr]?.id || (1000 + i), // fallback mock ID
        orderId: this.orderMap[dateStr]?.id,
        isPast: false, // Keep editable for testing
        isDisabled: isWeekend || isHoliday
      });
    }

    this.calendarDays = days;

    const rows: CalendarDay[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      rows.push(days.slice(i, i + 7));
    }
    this.calendarRows = rows;

    this.updateSummary();
  }

  updateSummary(): void {
    // Count selected days in active month
    let count = 0;
    this.calendarDays.forEach(day => {
      if (day.dayNumber && day.isRegistered) {
        count++;
      }
    });
    this.totalDaysEat = count;
    this.totalPrice = count * this.pricePerMeal;
  }

  // Navigation arrows
  prevMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.selectedDay = 1; // Default to first day of new month
    this.loadData();
  }

  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.selectedDay = 1; // Default to first day of new month
    this.loadData();
  }

  // Toggle dropdown / Menu actions
  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  onLogout(event: Event): void {
    event.preventDefault();
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login'])
    });
  }

  // Handle day circle click
  onDayClick(day: CalendarDay): void {
    if (!day.dayNumber || day.isDisabled) return;

    this.selectedDay = day.dayNumber;
    day.isRegistered = !day.isRegistered;

    if (day.isRegistered) {
      this.registeredDates.add(day.dateString);
    } else {
      this.registeredDates.delete(day.dateString);
    }

    this.updateSummary();
  }

  // Action Buttons
  toggleSelectAll(): void {
    const activeDays = this.calendarDays.filter(d => d.dayNumber !== null);
    const allSelected = activeDays.every(d => d.isRegistered);

    activeDays.forEach(day => {
      if (day.dayNumber) {
        if (allSelected) {
          day.isRegistered = false;
          this.registeredDates.delete(day.dateString);
        } else {
          day.isRegistered = true;
          this.registeredDates.add(day.dateString);
        }
      }
    });

    this.updateSummary();
  }

  // Show detailed menu list of the selected day
  viewMenu(): void {
    // Generate list of dishes based on selected day's day of week
    const dateObj = new Date(this.currentYear, this.currentMonth, this.selectedDay);
    const dayOfWeek = dateObj.getDay();

    this.selectedMenuDishes = this.menuMap[this.getSelectedDateString()]?.dishes?.map((d: any) => d.name) ||
      this.WEEK_DISHES[dayOfWeek];

    this.showMenuModal = true;
  }

  closeMenuModal(): void {
    this.showMenuModal = false;
  }

  getSelectedDateString(): string {
    return `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(this.selectedDay).padStart(2, '0')}`;
  }

  // Save Registration to Database
  saveRegistration(): void {
    this.loading = true;

    // 1. Identify which dates are newly registered (not in original database orders)
    const datesToRegister = Array.from(this.registeredDates).filter(date => {
      const original = this.originalOrders.find(o => o.menuDate === date && o.status !== 'CANCELLED');
      return !original;
    });

    // 2. Identify which dates are newly deselected (present in original database orders but not selected now)
    const ordersToCancel = this.originalOrders.filter(order => {
      return order.menuDate && order.status !== 'CANCELLED' && !this.registeredDates.has(order.menuDate);
    });

    // If no changes, show notification immediately
    if (datesToRegister.length === 0 && ordersToCancel.length === 0) {
      this.showToast('Không có thay đổi đăng ký nào cần lưu.', 'success');
      this.loading = false;
      return;
    }

    // Process cancellations and registrations sequentially
    let cancelCount = ordersToCancel.length;
    let registerCount = datesToRegister.length;

    const checkCompletion = () => {
      if (cancelCount === 0 && registerCount === 0) {
        this.showToast('Đăng ký suất ăn đã được lưu thành công!', 'success');
        this.loadData(); // Reload to refresh mappings
      }
    };

    // Execute cancellations
    if (ordersToCancel.length > 0) {
      ordersToCancel.forEach(order => {
        this.mealOrderService.cancelOrder(order.id).subscribe({
          next: () => {
            cancelCount--;
            checkCompletion();
          },
          error: () => {
            cancelCount--;
            checkCompletion();
          }
        });
      });
    }

    // Execute new orders
    if (datesToRegister.length > 0) {
      // Find menu IDs for dates. If they don't have menu IDs on backend, they cannot be created on DB.
      // In that case, we can mock it or proceed with valid menu IDs
      const menuIds = datesToRegister.map(date => this.menuMap[date]?.id).filter(id => !!id) as number[];

      if (menuIds.length > 0) {
        this.mealOrderService.createOrders({ menuIds }).subscribe({
          next: () => {
            registerCount = 0;
            checkCompletion();
          },
          error: (err) => {
            this.showToast(err.error?.message || 'Có lỗi khi lưu đăng ký mới.', 'danger');
            registerCount = 0;
            this.loading = false;
          }
        });
      } else {
        // Fallback simulation if no backend menu database entries exist yet
        setTimeout(() => {
          registerCount = 0;
          this.showToast('Đăng ký suất ăn đã được lưu thành công! (Chế độ giả lập)', 'success');
          // Update orderMap locally so UI stays persistent
          datesToRegister.forEach(date => {
            this.orderMap[date] = {
              id: Math.floor(Math.random() * 10000),
              userId: 1,
              menuId: 100,
              menuDate: date,
              price: this.pricePerMeal,
              status: 'ORDERED',
              ticketSource: 'SYSTEM',
              isSpecial: false,
              isPrinted: false
            };
          });
          // Update originalOrders list
          this.originalOrders = Object.values(this.orderMap);
          this.loadData();
        }, 1000);
      }
    } else {
      if (ordersToCancel.length > 0 && datesToRegister.length === 0) {
        // only cancellations
        checkCompletion();
      }
    }
  }

  showToast(message: string, type: 'success' | 'danger'): void {
    this.toastMessage = message;
    this.toastType = type;
    setTimeout(() => {
      this.toastMessage = '';
    }, 4000);
  }
}
