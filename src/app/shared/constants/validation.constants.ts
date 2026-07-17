/**
 * Quy tắc validate dùng chung cho các form (Add/Edit) ở khối System & Core.
 *
 * Đồng bộ 1-1 với validation phía Backend (ValidationConstants.java + @Size trên DTO)
 * để FE chặn lỗi sớm, tránh round-trip xuống server. KHÔNG hardcode Regex trong template —
 * mọi form tham chiếu tới các hằng số ở đây.
 */

/** Các mẫu Regex (mirror của ValidationConstants phía Backend). */
export const VALIDATION_PATTERNS = {
  /** Chỉ chữ số, không khoảng trắng (tài khoản đăng nhập). */
  ACCOUNT: /^\d+$/,
  /** Không chứa khoảng trắng (mật khẩu). */
  PASSWORD: /^\S+$/,
  /** Chữ cái (kể cả tiếng Việt) và khoảng trắng; không số, không ký tự đặc biệt (họ tên). */
  PERSON_NAME: /^[a-zA-ZÀ-ỹ\s()]+$/,
  /** Chữ cái (kể cả tiếng Việt), số và khoảng trắng; không ký tự đặc biệt (tên chung). */
  GENERAL_NAME: /^[a-zA-ZÀ-ỹ0-9\s]+$/,
  /** Chỉ chữ in hoa và dấu gạch dưới (mã code hệ thống). */
  CODE: /^[A-Z_]+$/,
} as const;

/** Giới hạn độ dài — khớp chính xác với @Size(...) trên DTO Backend / schema DB. */
export const VALIDATION_LENGTHS = {
  ACCOUNT: { min: 10, max: 50 },
  PASSWORD: { min: 8, max: 255 },
  PERSON_NAME: { max: 255 },
  ROLE_CODE: { max: 50 },
  ROLE_NAME: { max: 255 },
  PERMISSION_CODE: { max: 100 },
  DEPARTMENT_CODE: { max: 50 },
  DEPARTMENT_NAME: { max: 255 },
  DISH_NAME: { max: 255 },
  PRICE_NAME: { max: 100 },
} as const;
