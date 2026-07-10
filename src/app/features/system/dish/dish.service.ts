import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { shareReplay, catchError, tap, switchMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { PageResponse, ApiResponse } from '@shared/models';
import { Dish, DishCreateRequest, DishUpdateRequest } from '@shared/models/dish.model';

@Injectable({
  providedIn: 'root'
})
export class DishService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/dishes`;
  private cache = new Map<string, Observable<ApiResponse<PageResponse<Dish>>>>();
  private refresh$ = new BehaviorSubject<void>(undefined);

  clearCache(): void {
    this.cache.clear();
    this.refresh$.next();
  }

  query(query: any, page: number, size: number): Observable<ApiResponse<PageResponse<Dish>>> {
    const cacheKey = `${page}-${size}-${JSON.stringify(query)}`;
    if (!this.cache.has(cacheKey)) {
      let params = new HttpParams()
        .set('page', (page + 1).toString())
        .set('size', size.toString());

      if (query && query.keyword) {
        params = params.set('keyword', query.keyword);
      }
      if (query && query.types && query.types.length > 0) {
        params = params.set('types', query.types.join(','));
      }
      if (query && query.isActives && query.isActives.length > 0) {
        params = params.set('isActives', query.isActives.join(','));
      }

      const stream$ = this.refresh$.pipe(
        switchMap(() => this.http.get<ApiResponse<PageResponse<Dish>>>(this.apiUrl, { params })),
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

  add(form: DishCreateRequest): Observable<ApiResponse<Dish>> {
    return this.http.post<ApiResponse<Dish>>(this.apiUrl, form).pipe(
      tap(() => this.clearCache())
    );
  }

  edit(id: number | string, form: DishUpdateRequest): Observable<ApiResponse<Dish>> {
    return this.http.put<ApiResponse<Dish>>(`${this.apiUrl}/${id}`, form).pipe(
      tap(() => this.clearCache())
    );
  }

  delete(id: number | string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.clearCache())
    );
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
