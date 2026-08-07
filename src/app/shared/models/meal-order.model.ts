export interface DepartmentMemberOrder {
  fullName: string;
  departmentName: string;
  hasOrdered: boolean;
  isSpecial: boolean;
}

export interface DepartmentMealList {
  members: DepartmentMemberOrder[];
  guestNormalQuantity: number;
  guestSpecialQuantity: number;
}

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
  claimedFromName?: string;
}
