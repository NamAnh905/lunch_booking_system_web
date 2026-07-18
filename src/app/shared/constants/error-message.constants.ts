export const ERROR_CODES = {
  UNCATEGORIZED_EXCEPTION: 9999,
  INVALID_KEY: 9901,

  UNAUTHENTICATED: 1001,
  UNAUTHORIZED: 1002,
  TOKEN_GENERATION_FAILED: 1003,
  TOO_MANY_LOGIN_ATTEMPTS: 1004,

  USER_NOT_FOUND: 2001,
  USER_LOCKED: 2002,
  USER_USERNAME_EXISTS: 2003,
  USER_EMAIL_EXISTS: 2004,
  USER_EMPLOYEE_CODE_EXISTS: 2005,
  INVALID_PASSWORD: 2006,

  ROLE_NOT_FOUND: 3001,
  ROLE_ALREADY_EXISTS: 3002,
  PERMISSION_NOT_FOUND: 3501,
  PERMISSION_ALREADY_EXISTS: 3502,

  DEPARTMENT_NOT_FOUND: 4001,
  DEPARTMENT_CODE_EXISTS: 4002,

  DISH_NOT_FOUND: 5001,
  DISH_ALREADY_EXISTS: 5002,
  DISH_OUT_OF_STOCK: 5003,

  MENU_NOT_FOUND: 6001,
  MENU_ALREADY_EXISTS: 6002,

  ORDER_NOT_FOUND: 7001,
  ORDER_CUTOFF_REACHED: 7002,
  ORDER_ALREADY_EXISTS: 7003,
  ORDER_CANNOT_CANCEL: 7004,
  ORDER_IN_MARKET: 7005,
  ORDER_CANNOT_PASS: 7006,
  ORDER_CLAIMED_CANNOT_PASS: 7007,

  TICKET_NOT_FOUND: 9001,

  EXCHANGE_NOT_FOUND: 10001,
  EXCHANGE_NOT_OPEN: 10002,
  CANNOT_CLAIM_OWN_TICKET: 10003,

  NOTIFICATION_NOT_FOUND: 11001,

  PAYMENT_NOT_FOUND: 12001,
  INVALID_ENUM_VALUE: 12002,

  PRICE_NOT_FOUND: 13001,
  PRICE_ALREADY_EXISTS: 13002,

  ADMIN_REPORT_EMAIL_NOT_CONFIGURED: 14001,
  EXPORT_FAILED: 14002,

  IMAGE_INVALID: 15001,
  IMAGE_UPLOAD_FAILED: 15002,
  IMAGE_TYPE_NOT_ALLOWED: 15003,
  IMAGE_TOO_LARGE: 15004,
} as const;

export type ErrorCodeKey = keyof typeof ERROR_CODES;

export type ErrorMessageKey = ErrorCodeKey | 'UNKNOWN_ERROR' | 'NETWORK_ERROR';

export const DEFAULT_ERROR_KEY: ErrorMessageKey = 'UNKNOWN_ERROR';

export const ERROR_CODE_NAMES = Object.fromEntries(
  Object.entries(ERROR_CODES).map(([name, code]) => [code, name])
) as Readonly<Record<number, ErrorCodeKey | undefined>>;

export const ERROR_MESSAGES: Readonly<Record<ErrorMessageKey, string>> = {
  UNKNOWN_ERROR: 'Đã có lỗi xảy ra, vui lòng thử lại sau.',
  NETWORK_ERROR: 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra đường truyền và thử lại.',

  UNCATEGORIZED_EXCEPTION: 'Hệ thống đang gặp sự cố. Vui lòng thử lại sau.',
  INVALID_KEY: 'Dữ liệu nhập vào không hợp lệ. Vui lòng kiểm tra lại.',

  UNAUTHENTICATED: 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.',
  UNAUTHORIZED: 'Bạn không có quyền thực hiện thao tác này.',
  TOKEN_GENERATION_FAILED: 'Không thể tạo phiên đăng nhập. Vui lòng thử lại sau.',
  TOO_MANY_LOGIN_ATTEMPTS: 'Bạn đã đăng nhập sai quá nhiều lần. Vui lòng thử lại sau ít phút.',

  USER_NOT_FOUND: 'Không tìm thấy thông tin người dùng.',
  USER_LOCKED: 'Tài khoản của bạn đã bị khoá. Vui lòng liên hệ quản trị viên.',
  USER_USERNAME_EXISTS: 'Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác.',
  USER_EMAIL_EXISTS: 'Email này đã được sử dụng cho tài khoản khác.',
  USER_EMPLOYEE_CODE_EXISTS: 'Mã nhân viên đã tồn tại trong hệ thống.',
  INVALID_PASSWORD: 'Mật khẩu hiện tại không chính xác.',

  ROLE_NOT_FOUND: 'Không tìm thấy vai trò.',
  ROLE_ALREADY_EXISTS: 'Vai trò này đã tồn tại.',
  PERMISSION_NOT_FOUND: 'Không tìm thấy quyền.',
  PERMISSION_ALREADY_EXISTS: 'Quyền này đã tồn tại.',

  DEPARTMENT_NOT_FOUND: 'Không tìm thấy phòng ban.',
  DEPARTMENT_CODE_EXISTS: 'Mã phòng ban đã tồn tại.',

  DISH_NOT_FOUND: 'Không tìm thấy món ăn.',
  DISH_ALREADY_EXISTS: 'Món ăn này đã tồn tại.',
  DISH_OUT_OF_STOCK: 'Món ăn đã hết. Vui lòng chọn món khác.',

  MENU_NOT_FOUND: 'Không tìm thấy thực đơn.',
  MENU_ALREADY_EXISTS: 'Thực đơn cho ngày này đã tồn tại.',

  ORDER_NOT_FOUND: 'Không tìm thấy đơn đặt suất ăn.',
  ORDER_CUTOFF_REACHED: 'Đã quá thời gian đặt hoặc huỷ suất ăn.',
  ORDER_ALREADY_EXISTS: 'Bạn đã đặt suất ăn cho ngày này rồi.',
  ORDER_CANNOT_CANCEL: 'Không thể huỷ đơn đặt suất ăn này.',
  ORDER_IN_MARKET: 'Suất ăn đang được rao trên chợ vé. Vui lòng gỡ khỏi chợ trước.',
  ORDER_CANNOT_PASS: 'Không thể pass suất ăn này.',
  ORDER_CLAIMED_CANNOT_PASS: 'Vé đã nhận từ chợ không thể pass lại.',

  TICKET_NOT_FOUND: 'Không tìm thấy vé.',

  EXCHANGE_NOT_FOUND: 'Không tìm thấy giao dịch đổi vé.',
  EXCHANGE_NOT_OPEN: 'Giao dịch đổi vé không còn khả dụng.',
  CANNOT_CLAIM_OWN_TICKET: 'Bạn không thể nhận lại vé do chính mình pass.',

  NOTIFICATION_NOT_FOUND: 'Không tìm thấy thông báo.',

  PAYMENT_NOT_FOUND: 'Không tìm thấy thông tin thanh toán.',
  INVALID_ENUM_VALUE: 'Giá trị lựa chọn không hợp lệ.',

  PRICE_NOT_FOUND: 'Không tìm thấy bảng giá.',
  PRICE_ALREADY_EXISTS: 'Bảng giá này đã tồn tại.',

  ADMIN_REPORT_EMAIL_NOT_CONFIGURED: 'Chưa cấu hình email nhận báo cáo trong hệ thống.',
  EXPORT_FAILED: 'Xuất dữ liệu ra Excel thất bại. Vui lòng thử lại.',

  IMAGE_INVALID: 'File ảnh trống hoặc không hợp lệ.',
  IMAGE_UPLOAD_FAILED: 'Tải ảnh lên thất bại. Vui lòng thử lại.',
  IMAGE_TYPE_NOT_ALLOWED: 'Định dạng ảnh không được hỗ trợ.',
  IMAGE_TOO_LARGE: 'Dung lượng ảnh vượt quá giới hạn cho phép.',
};
