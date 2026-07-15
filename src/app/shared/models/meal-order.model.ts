export interface CalendarDay {
  dayNumber: number | null;
  dateString: string;
  isRegistered: boolean;
  isSpecial?: boolean;
  menuId?: number;
  orderId?: number;
  isPast?: boolean;
  isDisabled?: boolean;
  isPastOrCutoff?: boolean;
  isClaimedTicket?: boolean;
}
