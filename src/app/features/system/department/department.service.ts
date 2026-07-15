import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { PageResponse, ApiResponse } from '@shared/models';
import { DepartmentResponse, DepartmentCreateRequest, DepartmentUpdateRequest } from '@shared/models/department.model';
import { BaseCachedCrudService } from '@shared/services/base-cached-crud.service';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService extends BaseCachedCrudService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin/departments`;

  getAllDepartments(): Observable<ApiResponse<DepartmentResponse[]>> {
    return this.http.get<ApiResponse<DepartmentResponse[]>>(`${this.apiUrl}/all`);
  }

  getDepartments(page: number, size: number, keyword?: string): Observable<ApiResponse<PageResponse<DepartmentResponse>>> {
    const cacheKey = `${page}-${size}-${keyword || ''}`;
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (keyword) {
      params = params.set('keyword', keyword);
    }

    return this.cached(cacheKey, () =>
      this.http.get<ApiResponse<PageResponse<DepartmentResponse>>>(this.apiUrl, { params })
    );
  }

  createDepartment(data: DepartmentCreateRequest): Observable<ApiResponse<DepartmentResponse>> {
    return this.http.post<ApiResponse<DepartmentResponse>>(this.apiUrl, data).pipe(
      tap(() => this.clearCache())
    );
  }

  updateDepartment(id: number, data: DepartmentUpdateRequest): Observable<ApiResponse<DepartmentResponse>> {
    return this.http.put<ApiResponse<DepartmentResponse>>(`${this.apiUrl}/${id}`, data).pipe(
      tap(() => this.clearCache())
    );
  }

  deleteDepartment(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.clearCache())
    );
  }
}
