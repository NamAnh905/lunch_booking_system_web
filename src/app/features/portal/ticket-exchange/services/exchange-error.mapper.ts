import { Injectable, inject } from '@angular/core';
import { BusinessConfigService, formatVnTime } from '@core/services/business-config.service';
import { ErrorHandlerService } from '@core/services/error-handler.service';
import { ERROR_CODES } from '@shared/constants/error-message.constants';

@Injectable({ providedIn: 'root' })
export class ExchangeErrorMapper {
  private businessConfig = inject(BusinessConfigService);
  private errorHandler = inject(ErrorHandlerService);

  private get outOfWindow(): string {
    const { cutOffTime, exchangeLockTime } = this.businessConfig;
    return `Nằm ngoài khung giờ cho phép (${formatVnTime(cutOffTime)} hôm trước đến ${formatVnTime(exchangeLockTime)} hôm nay)!`;
  }
  private readonly alreadyHasMeal = 'Bạn đã có suất ăn trong ngày này, không thể nhận thêm!';
  private readonly ticketTaken = 'Vé này đã bị người khác nhận mất!';
  private readonly ticketGone = 'Vé này không còn trên chợ, có thể chủ vé đã thu hồi!';
  private readonly claimedCannotPass = 'Vé bạn nhận từ chợ không thể pass lại lên chợ!';
  private readonly alreadyInMarket = 'Vé này đang được đăng trên chợ, vui lòng tải lại trang!';
  private readonly ownTicketOnMarket = 'Bạn đang pass vé trên chợ nên không thể nhận thêm vé!';
  private readonly alreadyHasTicket = 'Bạn đang có vé nên không thể nhận thêm vé!';
  private readonly ownTicket = 'Đây là vé của chính bạn, không thể tự nhận!';

  private readonly staleTicketCodes: number[] = [
    ERROR_CODES.EXCHANGE_NOT_FOUND,
    ERROR_CODES.EXCHANGE_NOT_OPEN,
    ERROR_CODES.EXCHANGE_ALREADY_CLAIMED,
    ERROR_CODES.ORDER_IN_MARKET,
  ];

  isStaleTicket(err: any): boolean {
    return this.staleTicketCodes.includes(err?.error?.code);
  }

  map(err: any): string {
    if (err?.error?.code) {
      switch (err.error.code) {
        case ERROR_CODES.ORDER_CUTOFF_REACHED:
        case ERROR_CODES.ORDER_CANNOT_PASS:
          return this.outOfWindow;
        case ERROR_CODES.ORDER_CLAIMED_CANNOT_PASS:
          return this.claimedCannotPass;
        case ERROR_CODES.ORDER_IN_MARKET:
          return this.alreadyInMarket;
        case ERROR_CODES.ORDER_ALREADY_EXISTS:
          return this.alreadyHasMeal;
        case ERROR_CODES.USER_TICKET_ON_MARKET:
          return this.ownTicketOnMarket;
        case ERROR_CODES.USER_ALREADY_HAS_TICKET:
          return this.alreadyHasTicket;
        case ERROR_CODES.EXCHANGE_ALREADY_CLAIMED:
          return this.ticketTaken;
        case ERROR_CODES.EXCHANGE_NOT_FOUND:
        case ERROR_CODES.EXCHANGE_NOT_OPEN:
          return this.ticketGone;
        case ERROR_CODES.CANNOT_CLAIM_OWN_TICKET:
          return this.ownTicket;
      }
    }

    return this.errorHandler.getMessage(err);
  }
}
