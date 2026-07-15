import { Injectable, inject } from '@angular/core';
import { BusinessConfigService, formatVnTime } from '@shared/services/business-config.service';

/**
 * Quy tắc thời gian pass/nhận vé: từ giờ CUT_OFF_TIME ngày hôm trước đến giờ
 * TICKET_LOCK_TIME ngày ăn (mặc định 14h45 -> 10h30, có thể chỉnh ở màn hình
 * Cấu hình hệ thống). Trích từ `TicketExchangeComponent.isValidExchangeTime`
 * và phần tính cảnh báo lặp lại trong `fetchEligibleOrders`.
 */
@Injectable({ providedIn: 'root' })
export class ExchangeWindowService {
  private businessConfig = inject(BusinessConfigService);

  /** Tính cửa sổ [start, end] được phép pass vé cho một ngày ăn. */
  private windowFor(menuDateStr: string): { start: Date; end: Date } {
    const orderDate = new Date(menuDateStr);
    orderDate.setHours(0, 0, 0, 0);

    const cutOffTime = this.businessConfig.cutOffTime;
    const lockTime = this.businessConfig.exchangeLockTime;

    const start = new Date(orderDate);
    start.setDate(start.getDate() - 1);
    start.setHours(cutOffTime.hour, cutOffTime.minute, 0, 0);

    const end = new Date(orderDate);
    end.setHours(lockTime.hour, lockTime.minute, 0, 0);

    return { start, end };
  }

  /** `true` nếu hiện tại nằm trong cửa sổ được phép pass vé. */
  isValidExchangeTime(menuDateStr: string, now: Date = new Date()): boolean {
    const { start, end } = this.windowFor(menuDateStr);
    return now >= start && now <= end;
  }

  /** Trả về thông báo cảnh báo nếu ngoài cửa sổ, `null` nếu đang trong cửa sổ. */
  getWarning(menuDateStr: string, now: Date = new Date()): string | null {
    const { start, end } = this.windowFor(menuDateStr);
    if (now < start) {
      return `Chưa đến giờ pass vé ngày ${menuDateStr} (chỉ được pass sau ${formatVnTime(this.businessConfig.cutOffTime)} ngày hôm trước).`;
    }
    if (now > end) {
      return `Đã quá hạn pass vé ngày ${menuDateStr} (chỉ được pass trước ${formatVnTime(this.businessConfig.exchangeLockTime)} hôm nay).`;
    }
    return null;
  }
}
