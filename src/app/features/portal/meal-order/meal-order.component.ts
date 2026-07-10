import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MealOrderService } from './meal-order.service';
import { AuthService } from '@core/auth/auth.service';
import { OrderResponse, MenuResponse } from '@shared/models';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import Swal from 'sweetalert2';

import { CalendarDay } from '@shared/models/meal-order.model';
import { FormatMoneyPipe } from '../../../shared/pipes/format-money.pipe';

@Component({
  selector: 'app-meal-order',
  standalone: true,
  imports: [CommonModule, RouterModule, FormatMoneyPipe],
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

  pricePerMeal = 25000;
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
  menuGrid: { 
    priceName: string, 
    priceAmount: number, 
    maxDishes: number,
    dishRows: { dayDishes: string[] }[] 
  }[] = [];
  gridDays: { date: string, dayOfWeek: string }[] = [];
  isLoadingMenu = false;
  loading = false;
  toastMessage = '';
  toastType: 'success' | 'danger' = 'success';
  usernameDisplay = 'CNVT Đặng Nam Anh';

  MONTH_NAMES = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];

  WEEK_DISHES: Record<number, string[]> = {
    0: ['Thịt gà kho sả', 'Đậu phụ sốt cà chua', 'Canh rau cải ngọt', 'Cơm tẻ dẻo'],
    1: ['Thịt ba chỉ cháy cạnh', 'Cá rô phi rán giòn', 'Canh bí đao sườn heo', 'Cơm tẻ dẻo'],
    2: ['Gà rang gừng hành', 'Đậu phụ nhồi thịt sốt', 'Canh cà chua trứng lạp', 'Cơm tẻ dẻo'],
    3: ['Sườn xào chua ngọt', 'Cá quả kho tộ tiêu', 'Canh cải ngọt thịt băm', 'Cơm tẻ dẻo'],
    4: ['Thịt bò xào cần tỏi', 'Chả lá lốt rán giòn', 'Canh rau muống luộc sấu', 'Cơm tẻ dẻo'],
    5: ['Tôm rim ba chỉ cháy ngọt', 'Trứng đúc thịt băm', 'Canh bí đỏ xương hầm', 'Cơm tẻ dẻo'],
    6: ['Thịt chân giò luộc', 'Cá chép kho riềng', 'Canh cải xanh cá rô', 'Cơm tẻ dẻo']
  };

  SOLAR_HOLIDAYS = ['01-01', '04-30', '05-01', '09-02', '09-03'];

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    if (user) {
      this.usernameDisplay = `CNVT ${user.username}`;
    }
    
    // Đảm bảo clear cache mỗi khi vào trang (tránh lỗi cache khi mua/bán vé xong quay lại)
    this.monthCache = {};

    this.mealOrderService.getActivePrices().subscribe({
      next: (res) => {
        if (res && res.result && res.result.length > 0) {
          this.pricePerMeal = res.result[0].amount;
        } else {
          this.pricePerMeal = 25000;
        }
        this.loadData();
      },
      error: () => {
        this.pricePerMeal = 25000;
        this.loadData();
      }
    });
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
    }).pipe(
      catchError(err => {
        console.error(err);
        return of({ orders: { result: null }, menus: { result: null } } as any);
      })
    ).subscribe({
      next: (res) => {
        const orders = res.orders?.result || [];
        const menus = Array.isArray(res.menus?.result) ? res.menus.result : (res.menus?.result?.data || res.menus?.result?.content || []);

        // Save to cache
        this.monthCache[cacheKey] = { orders, menus };

        this.applyData(orders, menus);
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.showToast('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại!', 'danger');
        this.applyData([], []);
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
        const dateKey = order.menuDate.toString().split('T')[0];
        this.orderMap[dateKey] = order;
        this.registeredDates.add(dateKey);
      }
    });

    // Populate menu map
    this.menuMap = {};
    menusList.forEach(menu => {
      if (menu.menuDate) {
        const dateKey = menu.menuDate.toString().split('T')[0];
        this.menuMap[dateKey] = menu;
      } else if (menu.date) {
        const dateKey = menu.date.toString().split('T')[0];
        this.menuMap[dateKey] = menu; // Fallback in case backend returns date
      }
    });

    this.setupCalendar();
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
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Check cutoff time (14:45)
    const currentHour = today.getHours();
    const currentMinute = today.getMinutes();
    const isPastCutoff = (currentHour > 14) || (currentHour === 14 && currentMinute >= 45);

    let earliestSelectableDate: Date;
    if (isPastCutoff) {
      // Past 14:45 today -> only selectable starting from day after tomorrow
      earliestSelectableDate = new Date(todayStart.getTime() + 2 * 24 * 60 * 60 * 1000);
    } else {
      // Before 14:45 today -> selectable starting from tomorrow
      earliestSelectableDate = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    }

    // Pad empty cells before the 1st
    for (let i = 0; i < firstDay; i++) {
      days.push({ dayNumber: null, dateString: '', isRegistered: false });
    }

    // Generate actual days
    for (let i = 1; i <= totalDays; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const cellDate = new Date(year, month, i);
      const isReg = this.registeredDates.has(dateStr);

      // Check for weekends (0 = Sunday, 6 = Saturday)
      const dayOfWeek = cellDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // Check for public holidays (Solar dates)
      const solarHolidays = this.SOLAR_HOLIDAYS;
      const mmdd = `${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const isHoliday = solarHolidays.includes(mmdd);

      // Check if it's past cutoff time or weekend/holiday
      const isPastOrCutoff = cellDate.getTime() < earliestSelectableDate.getTime();
      const isDisabled = isWeekend || isHoliday;

      // Check if claimed from market
      const order = this.orderMap[dateStr];
      const originalUserId = order?.originalUserId;
      const currentUserId = this.authService.currentUserValue?.userId;
      const isClaimedTicket = isReg && originalUserId != null && originalUserId !== currentUserId;

      days.push({
        dayNumber: i,
        dateString: dateStr,
        isRegistered: isReg, // ONLY depends on having an order (isReg)
        menuId: this.menuMap[dateStr]?.id || (1000 + i), // fallback mock ID
        orderId: this.orderMap[dateStr]?.id,
        isPast: cellDate.getTime() < todayStart.getTime(),
        isDisabled: isDisabled,
        isPastOrCutoff: isPastOrCutoff,
        isClaimedTicket: isClaimedTicket
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
    
    if (day.isPastOrCutoff) {
      this.showToast('Đã qua giờ chốt, không thể thay đổi!', 'danger');
      return;
    }

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
    const activeSelectableDays = this.calendarDays.filter(d => d.dayNumber !== null && !d.isDisabled && !d.isPastOrCutoff);
    if (activeSelectableDays.length === 0) return;

    const allSelected = activeSelectableDays.every(d => d.isRegistered);

    activeSelectableDays.forEach(day => {
      if (allSelected) {
        day.isRegistered = false;
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
    const today = new Date();
    const dayOfWeek = today.getDay();
    // Calculate Monday (1) and Friday (5) of the current week
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);

    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    const startStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
    const endStr = `${friday.getFullYear()}-${String(friday.getMonth() + 1).padStart(2, '0')}-${String(friday.getDate()).padStart(2, '0')}`;

    this.showMenuModal = true;
    this.isLoadingMenu = true;
    this.menuGrid = [];
    this.gridDays = [];

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
    // Build days (Mon - Fri)
    const dayNames = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu'];
    this.gridDays = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const displayDateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      this.gridDays.push({
        date: dateStr,
        dayOfWeek: `${dayNames[i]}, ${displayDateStr}`
      });
    }

    // Group menus by priceId or priceName
    const priceGroups = new Map<number, { name: string, amount: number, menus: any[] }>();
    menus.forEach((m: any) => {
      if (!m || !m.price) return;
      // Filter out breakfast (Ăn sáng) if it exists
      if (m.price.name.toLowerCase().includes('sáng')) return;
      
      const priceId = m.price.id;
      if (!priceGroups.has(priceId)) {
        priceGroups.set(priceId, {
          name: m.price.name,
          amount: m.price.amount,
          menus: []
        });
      }
      priceGroups.get(priceId)?.menus.push(m);
    });

    this.menuGrid = [];
    priceGroups.forEach((group, priceId) => {
      const rowDays = this.gridDays.map(gd => {
        const menuForDay = group.menus.find(m => m.menuDate === gd.date);
        const dishes = (menuForDay?.dishes || [])
          .filter((d: any) => d != null)
          .map((d: any) => d?.name)
          .filter((name: string) => name);
        return {
          date: gd.date,
          dayOfWeek: gd.dayOfWeek,
          dishes: dishes
        };
      });
      const maxDishes = Math.max(1, ...rowDays.map(rd => rd.dishes.length));
      const dishRows = [];
      for (let i = 0; i < maxDishes; i++) {
         const dayDishes = rowDays.map(rd => rd.dishes[i] || '');
         dishRows.push({ dayDishes });
      }

      this.menuGrid.push({
        priceName: group.name,
        priceAmount: group.amount,
        maxDishes: maxDishes,
        dishRows: dishRows
      });
    });

    // sort rows by price amount
    this.menuGrid.sort((a, b) => a.priceAmount - b.priceAmount);
  }

  closeMenuModal(): void {
    this.showMenuModal = false;
  }

  goToTicketExchange(): void {
    this.router.navigate(['/portal/ticket-exchange']);
  }

  getSelectedDateString(): string {
    return `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(this.selectedDay).padStart(2, '0')}`;
  }

  // Save Registration to Database
  saveRegistration(): void {
    this.loading = true;

    // 1. Identify which dates are newly registered (not in original database orders)
    let datesToRegister = Array.from(this.registeredDates).filter(date => {
      const original = this.originalOrders.find(o => o.menuDate === date && o.status !== 'CANCELLED');
      return !original;
    });

    // 2. Identify which dates are newly deselected (present in original database orders but not selected now)
    const ordersToCancel = this.originalOrders.filter(order => {
      return order.menuDate && order.status !== 'CANCELLED' && !this.registeredDates.has(order.menuDate);
    });

    // 3. (Removed) Filter out invalid dates (no menu) to ensure valid state, since menu_id is no longer required.

    // If no changes, show notification immediately
    if (datesToRegister.length === 0 && ordersToCancel.length === 0) {
      this.showToast('Không có thay đổi đăng ký nào cần lưu.', 'success');
      this.loading = false;
      return;
    }

    // Process cancellations and registrations sequentially
    let cancelCount = ordersToCancel.length;
    let registerCount = datesToRegister.length;

    let hasError = false;

    const checkCompletion = () => {
      if (cancelCount === 0 && registerCount === 0) {
        const cacheKey = `${this.currentYear}-${this.currentMonth}`;
        delete this.monthCache[cacheKey]; // Clear cache to fetch latest DB state

        if (!hasError) {
          Swal.fire({
            icon: 'success',
            title: 'Successfully',
            text: 'Đăng ký ngày ăn thành công !',
            confirmButtonText: 'OK',
            confirmButtonColor: '#70c4f4',
            allowOutsideClick: false
          }).then((result) => {
            if (result.isConfirmed) {
              this.loadData(); // Reload to refresh mappings
            }
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Failed',
            text: 'Đăng ký vé ăn không thành công',
            confirmButtonText: 'OK',
            confirmButtonColor: '#70c4f4',
            allowOutsideClick: false
          }).then((result) => {
            if (result.isConfirmed) {
              this.loadData();
            }
          });
        }
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
            hasError = true;
            cancelCount--;
            checkCompletion();
          }
        });
      });
    }

    // Execute new orders
    if (datesToRegister.length > 0) {
      console.log('Payload gửi đi (orderDates):', datesToRegister);

      this.mealOrderService.createOrders({ orderDates: datesToRegister }).subscribe({
        next: (res) => {
          const failedOrders = res.result?.filter(o => o.status === 'FAILED') || [];
          if (failedOrders.length > 0) {
            hasError = true;
          }
          registerCount = 0;
          checkCompletion();
        },
        error: (err) => {
          hasError = true;
          registerCount = 0;
          checkCompletion();
        }
      });
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
