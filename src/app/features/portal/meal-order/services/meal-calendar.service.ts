import { Injectable, inject } from '@angular/core';
import { CalendarDay } from '@shared/models/meal-order.model';
import { OrderResponse } from '@shared/models';
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

    const earliestSelectableDate = this.businessConfig.earliestOrderableDate(today);

    const days: CalendarDay[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push({ dayNumber: null, dateString: '', isRegistered: false });
    }

    for (let i = 1; i <= totalDays; i++) {
      const cellDate = new Date(year, month, i);
      const dateStr = toIsoDate(cellDate);
      const isReg = registeredDates.has(dateStr);

      const isHoliday = this.businessConfig.holidays.has(dateStr);
      const isBeyondWindow = dateStr > this.businessConfig.maxOrderableDate;
      const isDisabled = isWeekend(cellDate) || isHoliday || isBeyondWindow;
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
        claimedFromName: isClaimedTicket ? order?.originalUserFullName : undefined,
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
