import { Injectable, inject } from '@angular/core';
import { BusinessConfigService, formatVnTime } from '@shared/services/business-config.service';

const ERROR_CODE = {
  ORDER_CUTOFF_REACHED: 7002,
  ORDER_ALREADY_EXISTS: 7003,
  ORDER_IN_MARKET: 7005,
  ORDER_CANNOT_PASS: 7006,
  ORDER_CLAIMED_CANNOT_PASS: 7007,
  EXCHANGE_NOT_FOUND: 10001,
  EXCHANGE_NOT_OPEN: 10002,
  CANNOT_CLAIM_OWN_TICKET: 10003,
} as const;

@Injectable({ providedIn: 'root' })
export class ExchangeErrorMapper {
  private businessConfig = inject(BusinessConfigService);

  private get outOfWindow(): string {
    const { cutOffTime, exchangeLockTime } = this.businessConfig;
    return `Nằm ngoài khung giờ cho phép (${formatVnTime(cutOffTime)} hôm trước đến ${formatVnTime(exchangeLockTime)} hôm nay)!`;
  }
  private readonly alreadyHasMeal = 'Bạn đã có suất ăn trong ngày này, không thể nhận thêm!';
  private readonly ticketTaken = 'Vé này đã bị người khác nhận mất, vui lòng tải lại trang!';
  private readonly claimedCannotPass = 'Vé bạn nhận từ chợ không thể pass lại lên chợ!';
  private readonly alreadyInMarket = 'Vé này đang được đăng trên chợ, vui lòng tải lại trang!';
  private readonly generic = 'Đã có lỗi xảy ra, vui lòng thử lại!';

  map(err: any): string {
    if (err?.error?.code) {
      switch (err.error.code) {
        case ERROR_CODE.ORDER_CUTOFF_REACHED:
        case ERROR_CODE.ORDER_CANNOT_PASS:
          return this.outOfWindow;
        case ERROR_CODE.ORDER_CLAIMED_CANNOT_PASS:
          return this.claimedCannotPass;
        case ERROR_CODE.ORDER_IN_MARKET:
          return this.alreadyInMarket;
        case ERROR_CODE.ORDER_ALREADY_EXISTS:
          return this.alreadyHasMeal;
        case ERROR_CODE.EXCHANGE_NOT_FOUND:
        case ERROR_CODE.EXCHANGE_NOT_OPEN:
        case ERROR_CODE.CANNOT_CLAIM_OWN_TICKET:
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
