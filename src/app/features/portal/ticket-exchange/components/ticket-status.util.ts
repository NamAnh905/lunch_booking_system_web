import { TicketExchangeStatus } from '@shared/enums';

export function ticketStatusLabel(status: string): string {
  switch ((status ?? '').toUpperCase()) {
    case TicketExchangeStatus.OPEN:
      return 'Đang chờ';
    case TicketExchangeStatus.MATCHED:
      return 'Đã ghép';
    case TicketExchangeStatus.CANCELLED:
      return 'Đã huỷ';
    case TicketExchangeStatus.EXPIRED:
      return 'Hết hạn';
    default:
      return status;
  }
}
