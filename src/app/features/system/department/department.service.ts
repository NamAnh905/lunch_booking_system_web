import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { shareReplay, catchError, tap, switchMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { PageResponse, ApiResponse } from '@shared/models';
import { DepartmentResponse, DepartmentCreateRequest, DepartmentUpdateRequest } from '@shared/models/department.model';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin/departments`;

  private cache = new Map<string, Observable<ApiResponse<PageResponse<DepartmentResponse>>>>();
  private refresh$ = new BehaviorSubject<void>(undefined);

  clearCache(): void {
    this.cache.clear();
    this.refresh$.next();
  }

  getDepartments(page: number, size: number, keyword?: string): Observable<ApiResponse<PageResponse<DepartmentResponse>>> {
    const cacheKey = `${page}-${size}-${keyword || ''}`;
    if (!this.cache.has(cacheKey)) {
      let params = new HttpParams()
        .set('page', page.toString())
        .set('size', size.toString());

      if (keyword) {
        params = params.set('keyword', keyword);
      }

      const stream$ = this.refresh$.pipe(
        switchMap(() => this.http.get<ApiResponse<PageResponse<DepartmentResponse>>>(this.apiUrl, { params })),
        shareReplay(1),
        catchError(error => {
          this.cache.delete(cacheKey);
          return throwError(() => error);
        })
      );
      this.cache.set(cacheKey, stream$);
    }
    return this.cache.get(cacheKey)!;
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
