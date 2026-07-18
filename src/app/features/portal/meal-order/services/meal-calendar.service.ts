import { Injectable, inject } from '@angular/core';
import { CalendarDay } from '@shared/models/meal-order.model';
import { OrderResponse } from '@shared/models';
import { SOLAR_HOLIDAYS } from '@shared/constants/business.constants';
import { BusinessConfigService } from '@core/services/business-config.service';
import { toIsoDate, isWeekend } from '@shared/utils/date.util';

export interface BuildCalendarParams {
  year: number;
  month: number;
  registeredDates: Set<string>;
  orderMap: Record<string, OrderResponse>;
  menuMap: Record<string, any>;
  currentUserId?: number;
}

@Injectable({ providedIn: 'root' })
export class MealCalendarService {
  private businessConfig = inject(BusinessConfigService);

  buildCalendar(params: BuildCalendarParams): CalendarDay[] {
    const { year, month, registeredDates, orderMap, menuMap, currentUserId } = params;

    const firstDay = new Date(year, month, 1).getDay(); // 0 = CN
    const totalDays = new Date(year, month + 1, 0).getDate();

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const { hour: cutHour, minute: cutMinute } = this.businessConfig.cutOffTime;
    const isPastCutoff =
      today.getHours() > cutHour ||
      (today.getHours() === cutHour && today.getMinutes() >= cutMinute);

    const dayOffset = isPastCutoff ? 2 : 1;
    const earliestSelectableDate = new Date(todayStart.getTime() + dayOffset * 24 * 60 * 60 * 1000);

    const days: CalendarDay[] = [];

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
        menuId: menuMap[dateStr]?.id,
        orderId: orderMap[dateStr]?.id,
        isPast: cellDate.getTime() < todayStart.getTime(),
        isDisabled,
        isPastOrCutoff,
        isClaimedTicket,
      });
    }

    return days;
  }

  toRows(days: CalendarDay[]): CalendarDay[][] {
    const rows: CalendarDay[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      rows.push(days.slice(i, i + 7));
    }
    return rows;
  }
}
