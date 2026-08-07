import { MealType } from '@shared/enums/meal-type.enum';
import { OrderStatus } from '@shared/enums/order-status.enum';

export const MEAL_PRICE = {
  NORMAL: 25000,
  SPECIAL: 40000,
} as const;

export const MEAL_TYPE_LABELS: Readonly<Record<MealType, string>> = {
  [MealType.NORMAL]: 'Suất thường',
  [MealType.SPECIAL]: 'Suất tăng cường',
};

export const MEAL_TYPE_OPTIONS: readonly { value: MealType; label: string }[] = [
  { value: MealType.NORMAL, label: MEAL_TYPE_LABELS[MealType.NORMAL] },
  { value: MealType.SPECIAL, label: MEAL_TYPE_LABELS[MealType.SPECIAL] },
];

export const CURRENCY_SUFFIX = 'VNĐ';

export const CUTOFF_TIME = {
  ORDER: { hour: 14, minute: 45 },
  EXCHANGE_START: { hour: 14, minute: 45 },
  EXCHANGE_END: { hour: 12, minute: 30 },
} as const;

export const MAX_ADVANCE_MONTHS = 3;

export const REGISTERED_ORDER_STATUSES: readonly OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.ON_MARKET,
  OrderStatus.PRINTED,
];

export const PASSABLE_ORDER_STATUSES: readonly string[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
];

export const SWAL_COLORS = {
  PRIMARY: '#70c4f4',
  SPECIAL: '#ff5722',
  NORMAL: '#FCB71E',
  DANGER: '#d33',
} as const;

export const DEFAULT_PAGE_SIZE = 10;

export const EXCEL_FILE_NAMES = {
  DISH_LIST: 'danh_sach_mon_an.xlsx',
  MENU_LIST: 'danh_sach_thuc_don.xlsx',
  USER_LIST: 'danh_sach_nguoi_dung.xlsx',
  USER_IMPORT_TEMPLATE: 'mau_nhap_nguoi_dung.xlsx',
  PERMISSION_LIST: 'danh_sach_quyen.xlsx',
  TICKET_EXCHANGE_LIST: 'lich_su_trao_doi_ve.xlsx',
  DAILY_ORDER_SUMMARY: (formattedDate: string) => `tong_hop_suat_an_${formattedDate}.xlsx`,
  MONTHLY_ORDER_TRACKING: (month: number | string, year: number | string) =>
    `theo_doi_dat_com_thang_${month}_${year}.xlsx`,
} as const;

export const APP_ROUTES = {
  LOGIN: '/login',
  TICKET_EXCHANGE: '/portal/ticket-exchange',
  ORDER_DAILY: '/statistic/order-daily',
} as const;

export const APP_DATE_FORMAT = 'dd/MM/yyyy';

export const APP_DATE_TIME_FORMAT = `${APP_DATE_FORMAT} HH:mm`;
