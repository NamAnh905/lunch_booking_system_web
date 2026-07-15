import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PageResponse, ApiResponse } from '@shared/models';
import { Menu, MenuCreateRequest, MenuUpdateRequest, MenuImageCreateRequest, UploadResponse } from '@shared/models/menu.model';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin/menus`;
  private uploadUrl = `${environment.apiUrl}/admin/uploads`;

  query(query: any, page: number, size: number): Observable<ApiResponse<PageResponse<Menu>>> {
    let params = new HttpParams()
      .set('page', (page + 1).toString())
      .set('size', size.toString());

    if (query && query.keyword) {
      params = params.set('keyword', query.keyword);
    }

    return this.http.get<ApiResponse<PageResponse<Menu>>>(this.apiUrl, { params });
  }

  getByDate(date: string): Observable<ApiResponse<Menu[]>> {
    return this.http.get<ApiResponse<Menu[]>>(`${this.apiUrl}/by-date?date=${date}`);
  }

  getWeeklyMenus(startDate: string, endDate: string): Observable<ApiResponse<Menu[]>> {
    return this.http.get<ApiResponse<Menu[]>>(`${this.apiUrl}/weekly?startDate=${startDate}&endDate=${endDate}`);
  }

  add(form: MenuCreateRequest): Observable<ApiResponse<Menu>> {
    return this.http.post<ApiResponse<Menu>>(this.apiUrl, form);
  }

  /** Tải ảnh lên Cloudinary, trả về URL an toàn. */
  uploadImage(file: File): Observable<ApiResponse<UploadResponse>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<UploadResponse>>(`${this.uploadUrl}/image`, formData);
  }

  /** Tạo thực đơn dạng hình ảnh (theo tuần). */
  addImageMenu(form: MenuImageCreateRequest): Observable<ApiResponse<Menu>> {
    return this.http.post<ApiResponse<Menu>>(`${this.apiUrl}/image`, form);
  }

  /** Cập nhật thực đơn dạng hình ảnh. */
  updateImageMenu(id: number | string, form: MenuImageCreateRequest): Observable<ApiResponse<Menu>> {
    return this.http.put<ApiResponse<Menu>>(`${this.apiUrl}/image/${id}`, form);
  }

  edit(id: number | string, form: MenuUpdateRequest): Observable<ApiResponse<Menu>> {
    return this.http.put<ApiResponse<Menu>>(`${this.apiUrl}/${id}`, form);
  }

  delete(id: number | string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  exportExcel(keyword?: string): Observable<Blob> {
    let params = new HttpParams();
    if (keyword) {
      params = params.set('keyword', keyword);
    }
    return this.http.get(`${this.apiUrl}/export`, {
      params,
      responseType: 'blob'
    });
  }
}
