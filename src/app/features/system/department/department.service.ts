import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PageResponse, ApiResponse } from '@shared/models';
import { DepartmentResponse, DepartmentCreateRequest, DepartmentUpdateRequest } from '@shared/models/department.model';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin/departments`;

  getDepartments(page: number, size: number, keyword?: string): Observable<ApiResponse<PageResponse<DepartmentResponse>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (keyword) {
      params = params.set('keyword', keyword);
    }

    return this.http.get<ApiResponse<PageResponse<DepartmentResponse>>>(this.apiUrl, { params });
  }

  createDepartment(data: DepartmentCreateRequest): Observable<ApiResponse<DepartmentResponse>> {
    return this.http.post<ApiResponse<DepartmentResponse>>(this.apiUrl, data);
  }

  updateDepartment(id: number, data: DepartmentUpdateRequest): Observable<ApiResponse<DepartmentResponse>> {
    return this.http.put<ApiResponse<DepartmentResponse>>(`${this.apiUrl}/${id}`, data);
  }

  deleteDepartment(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
