/**
 * Chuẩn hoá dữ liệu phân trang trả về từ `ApiResponse` của Spring Boot.
 *
 * Xử lý cả 3 dạng payload đang tồn tại trong dự án:
 *  1. Bọc trong `result` (ApiResponse wrapper).
 *  2. Mảng thuần `T[]`.
 *  3. Object phân trang dùng `data`/`content` + `totalElements`.
 *
 * Thay thế đoạn unwrap lặp lại trong base-crud.component (loadData)
 * và menu.component (loadPrices / loadDishes).
 */
export interface NormalizedPage<T> {
  data: T[];
  total: number;
}

export function unwrapPage<T>(res: unknown): NormalizedPage<T> {
  const body = res as Record<string, any> | null | undefined;
  const payload = body?.['result'] !== undefined ? body!['result'] : body;

  if (Array.isArray(payload)) {
    return { data: payload as T[], total: payload.length };
  }

  const data: T[] = payload?.data ?? payload?.content ?? [];
  const total: number = payload?.totalElements ?? data.length;
  return { data, total };
}
