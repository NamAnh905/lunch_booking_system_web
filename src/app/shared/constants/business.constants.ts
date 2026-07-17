import { OrderStatus } from '@shared/enums/order-status.enum';


/** Giá suất ăn (VNĐ). Dùng làm fallback khi API `/prices/active` lỗi. */
export const MEAL_PRICE = {
  NORMAL: 25000,
  SPECIAL: 40000,
} as const;

export const CURRENCY_SUFFIX = 'VNĐ';

/**
 * Khung giờ chốt đơn / đổi vé.
 *  - ORDER: sau giờ này thì ngày mai không đặt được nữa (đẩy sang ngày kia).
 *  - EXCHANGE_START -> EXCHANGE_END: cửa sổ pass vé (14h45 hôm trước đến 10h30 hôm sau).
 */
export const CUTOFF_TIME = {
  ORDER: { hour: 14, minute: 45 },
  EXCHANGE_START: { hour: 14, minute: 45 },
  EXCHANGE_END: { hour: 11, minute: 0 },
} as const;

/** Ngày lễ dương lịch cố định (định dạng 'MM-DD') — không cho đặt suất ăn. */
export const SOLAR_HOLIDAYS: readonly string[] = [
  '01-01', // Tết Dương lịch
  '04-30', // Giải phóng miền Nam
  '05-01', // Quốc tế Lao động
  '09-02', // Quốc khánh
  '09-03',
];

/** Các trạng thái đơn được coi là "đã đăng ký" (thay cho mảng string literal trong order-daily). */
export const REGISTERED_ORDER_STATUSES: readonly OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.ON_MARKET,
  OrderStatus.PRINTED,
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
