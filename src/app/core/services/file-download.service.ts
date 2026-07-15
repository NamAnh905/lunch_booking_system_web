import { Injectable } from '@angular/core';

/**
 * Đóng gói logic tải một `Blob` về máy người dùng
 * (tạo thẻ <a>, gán href, click, rồi thu hồi Object URL).
 *
 * Thay thế đoạn boilerplate lặp lại trong:
 *  - menu.component (onExport)
 *  - order-monthly.component (exportExcel)
 *  - order-daily.component (exportExcel)
 */
@Injectable({ providedIn: 'root' })
export class FileDownloadService {
  /** Lưu một `Blob` thành file với tên chỉ định. */
  save(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  }
}
