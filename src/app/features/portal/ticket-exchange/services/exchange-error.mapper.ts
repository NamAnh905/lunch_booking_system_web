import { Injectable, inject } from '@angular/core';
import { BusinessConfigService, formatVnTime } from '@shared/services/business-config.service';

/**
 * Ánh xạ lỗi HTTP từ API đổi vé sang thông báo tiếng Việt thân thiện.
 * Trích từ `TicketExchangeComponent.handleError`.
 */
@Injectable({ providedIn: 'root' })
export class ExchangeErrorMapper {
  private businessConfig = inject(BusinessConfigService);

  private get outOfWindow(): string {
    const { cutOffTime, exchangeLockTime } = this.businessConfig;
    return `Nằm ngoài khung giờ cho phép (${formatVnTime(cutOffTime)} hôm trước đến ${formatVnTime(exchangeLockTime)} hôm nay)!`;
  }
  private readonly alreadyHasMeal = 'Bạn đã có suất ăn trong ngày này, không thể nhận thêm!';
  private readonly ticketTaken = 'Vé này đã bị người khác nhận mất, vui lòng tải lại trang!';
  private readonly generic = 'Đã có lỗi xảy ra, vui lòng thử lại!';

  map(err: any): string {
    if (err?.error?.code) {
      switch (err.error.code) {
        case 'ORDER_CUTOFF_REACHED':
        case 'ORDER_CANNOT_PASS':
          return this.outOfWindow;
        case 'ORDER_ALREADY_EXISTS':
          return this.alreadyHasMeal;
        case 'EXCHANGE_NOT_FOUND':
        case 'EXCHANGE_NOT_OPEN':
        case 'CANNOT_CLAIM_OWN_TICKET':
          return this.ticketTaken;
        default:
          return err.error.message || this.generic;
      }
    }

    if (err?.error?.message) {
      const msg = err.error.message.toLowerCase();
      if (msg.includes('lock') || msg.includes('optimistic') || msg.includes('đã nhận')) {
        return this.ticketTaken;
      }
      if (msg.includes('trùng') || msg.includes('đã có')) {
        return this.alreadyHasMeal;
      }
      if (msg.includes('cut-off') || msg.includes('chốt')) {
        return this.outOfWindow;
      }
      return err.error.message;
    }

    return this.generic;
  }
}
