import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RoleResponse, RoleCreateRequest, RoleUpdateRequest, PageResponse } from '@shared/models';
import { environment } from '../../../../environments/environment';
import { BaseCachedCrudService } from '@shared/services/base-cached-crud.service';

@Injectable({
  providedIn: 'root'
})
export class RoleService extends BaseCachedCrudService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin/roles`;

  query(query: { keyword?: string }): Observable<PageResponse<RoleResponse>> {
    const cacheKey = query.keyword || '';
    const params: any = {};
    if (query.keyword) {
      params.keyword = query.keyword;
    }
    return this.cached(cacheKey, () =>
      this.http.get<PageResponse<RoleResponse>>(this.apiUrl, { params })
    );
  }

  add(form: RoleCreateRequest): Observable<RoleResponse> {
    return this.http.post<RoleResponse>(this.apiUrl, form).pipe(
      tap(() => this.clearCache())
    );
  }

  edit(id: number | string, form: RoleUpdateRequest): Observable<RoleResponse> {
    return this.http.put<RoleResponse>(`${this.apiUrl}/${id}`, form).pipe(
      tap(() => this.clearCache())
    );
  }

  delete(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.clearCache())
    );
  }
}
