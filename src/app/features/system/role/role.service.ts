import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { shareReplay, catchError, tap, switchMap } from 'rxjs/operators';
import { RoleResponse, RoleCreateRequest, RoleUpdateRequest, PageResponse } from '@shared/models';

import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private apiUrl = `${environment.apiUrl}/admin/roles`;
  private cache = new Map<string, Observable<PageResponse<RoleResponse>>>();
  private refresh$ = new BehaviorSubject<void>(undefined);

  constructor(private http: HttpClient) { }

  clearCache(): void {
    this.cache.clear();
    this.refresh$.next();
  }

  query(query: { keyword?: string }): Observable<PageResponse<RoleResponse>> {
    const cacheKey = query.keyword || '';
    if (!this.cache.has(cacheKey)) {
      let params: any = {};
      if (query.keyword) {
        params.keyword = query.keyword;
      }
      const stream$ = this.refresh$.pipe(
        switchMap(() => this.http.get<PageResponse<RoleResponse>>(this.apiUrl, { params })),
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
