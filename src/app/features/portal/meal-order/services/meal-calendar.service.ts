import { Injectable, inject } from '@angular/core';
import { CalendarDay } from '@shared/models/meal-order.model';
import { OrderResponse } from '@shared/models';
import { SOLAR_HOLIDAYS } from '@shared/constants/business.constants';
import { BusinessConfigService } from '@shared/services/business-config.service';
import { toIsoDate, isWeekend } from '@shared/utils/date.util';

export interface BuildCalendarParams {
  /** Năm hiển thị. */
  year: number;
  /** Tháng hiển thị (0-indexed, giống Date.getMonth()). */
  month: number;
  /** Tập ngày đã đăng ký (ISO 'YYYY-MM-DD'). */
  registeredDates: Set<string>;
  /** Map đơn theo ngày (ISO). */
  orderMap: Record<string, OrderResponse>;
  /** Map thực đơn theo ngày (ISO). */
  menuMap: Record<string, any>;
  /** Id người dùng hiện tại (để xác định vé nhận từ chợ). */
  currentUserId?: number;
}

/**
 * Dựng danh sách ô ngày cho lịch đặt suất ăn.
 * Trích từ `MealOrderComponent.setupCalendar` — logic thuần, có thể unit-test độc lập.
 */
@Injectable({ providedIn: 'root' })
export class MealCalendarService {
  private businessConfig = inject(BusinessConfigService);

  buildCalendar(params: BuildCalendarParams): CalendarDay[] {
    const { year, month, registeredDates, orderMap, menuMap, currentUserId } = params;

    const firstDay = new Date(year, month, 1).getDay(); // 0 = CN
    const totalDays = new Date(year, month + 1, 0).getDate();

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Kiểm tra giờ chốt đơn.
    const { hour: cutHour, minute: cutMinute } = this.businessConfig.cutOffTime;
    const isPastCutoff =
      today.getHours() > cutHour ||
      (today.getHours() === cutHour && today.getMinutes() >= cutMinute);

    // Sau giờ chốt -> chỉ chọn được từ ngày kia; trước giờ chốt -> từ ngày mai.
    const dayOffset = isPastCutoff ? 2 : 1;
    const earliestSelectableDate = new Date(todayStart.getTime() + dayOffset * 24 * 60 * 60 * 1000);

    const days: CalendarDay[] = [];

    // Ô trống trước ngày 1.
    for (let i = 0; i < firstDay; i++) {
      days.push({ dayNumber: null, dateString: '', isRegistered: false });
    }

    for (let i = 1; i <= totalDays; i++) {
      const cellDate = new Date(year, month, i);
      const dateStr = toIsoDate(cellDate);
      const isReg = registeredDates.has(dateStr);

      const mmdd = `${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const isHoliday = SOLAR_HOLIDAYS.includes(mmdd);
      const isDisabled = isWeekend(cellDate) || isHoliday;
      const isPastOrCutoff = cellDate.getTime() < earliestSelectableDate.getTime();

      const order = orderMap[dateStr];
      const originalUserId = order?.originalUserId;
      const isClaimedTicket = isReg && originalUserId != null && originalUserId !== currentUserId;

      days.push({
        dayNumber: i,
        dateString: dateStr,
        isRegistered: isReg,
        menuId: menuMap[dateStr]?.id, // id thực đơn thật từ BE (undefined nếu ngày chưa có thực đơn)
        orderId: orderMap[dateStr]?.id,
        isPast: cellDate.getTime() < todayStart.getTime(),
        isDisabled,
        isPastOrCutoff,
        isClaimedTicket,
      });
    }

    return days;
  }

  /** Chia mảng ngày thành các hàng 7 cột (một tuần). */
  toRows(days: CalendarDay[]): CalendarDay[][] {
    const rows: CalendarDay[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      rows.push(days.slice(i, i + 7));
    }
    return rows;
  }
}
