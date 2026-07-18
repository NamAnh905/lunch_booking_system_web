import { Injectable, inject } from '@angular/core';
import { BusinessConfigService, formatVnTime } from '@core/services/business-config.service';

@Injectable({ providedIn: 'root' })
export class ExchangeWindowService {
  private businessConfig = inject(BusinessConfigService);

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

  isValidExchangeTime(menuDateStr: string, now: Date = new Date()): boolean {
    const { start, end } = this.windowFor(menuDateStr);
    return now >= start && now <= end;
  }

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
