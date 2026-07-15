import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PageResponse, ApiResponse } from '@shared/models';
import { UserResponse, UserCreateRequest, UserUpdateRequest } from '@shared/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin/users`;

  getAll(): Observable<ApiResponse<UserResponse[]>> {
    return this.http.get<ApiResponse<UserResponse[]>>(`${this.apiUrl}/all`);
  }

  query(query: any, page: number, size: number): Observable<ApiResponse<PageResponse<UserResponse>>> {
    let params = new HttpParams()
      .set('page', (page + 1).toString())
      .set('size', size.toString()); // Pass size parameter to backend
    
    // Add other query params if any
    if (query && query.keyword) {
      params = params.set('keyword', query.keyword);
    }
    if (query && query.departmentIds && query.departmentIds.length > 0) {
      params = params.set('departmentIds', query.departmentIds.join(','));
    }
    if (query && query.isActives && query.isActives.length > 0) {
      params = params.set('isActives', query.isActives.join(','));
    }

    return this.http.get<ApiResponse<PageResponse<UserResponse>>>(this.apiUrl, { params });
  }

  add(form: UserCreateRequest): Observable<ApiResponse<UserResponse>> {
    return this.http.post<ApiResponse<UserResponse>>(this.apiUrl, form);
  }

  edit(id: number | string, form: UserUpdateRequest): Observable<ApiResponse<UserResponse>> {
    return this.http.put<ApiResponse<UserResponse>>(`${this.apiUrl}/${id}`, form);
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
