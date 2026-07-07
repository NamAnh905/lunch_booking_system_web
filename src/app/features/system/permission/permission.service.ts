import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, PageResponse } from '@shared/models/base.model';
import { Permission, PermissionCreateRequest, PermissionUpdateRequest } from '@shared/models/permission.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private apiUrl = `${environment.apiUrl}/admin/permissions`;

  constructor(private http: HttpClient) {}

  getPermissions(page: number, size: number, keyword: string = ''): Observable<ApiResponse<PageResponse<Permission>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
      
    if (keyword) {
      params = params.set('keyword', keyword);
    }

    return this.http.get<ApiResponse<PageResponse<Permission>>>(this.apiUrl, { params });
  }

  getPermissionByAction(action: string): Observable<ApiResponse<Permission>> {
    return this.http.get<ApiResponse<Permission>>(`${this.apiUrl}/search`, {
      params: new HttpParams().set('action', action)
    });
  }

  createPermission(data: PermissionCreateRequest): Observable<ApiResponse<Permission>> {
    return this.http.post<ApiResponse<Permission>>(this.apiUrl, data);
  }

  updatePermission(id: number, data: PermissionUpdateRequest): Observable<ApiResponse<Permission>> {
    return this.http.put<ApiResponse<Permission>>(`${this.apiUrl}/${id}`, data);
  }

  deletePermission(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
