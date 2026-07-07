import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PageResponse, ApiResponse } from '@shared/models';
import { Dish, DishCreateRequest, DishUpdateRequest } from '@shared/models/dish.model';

@Injectable({
  providedIn: 'root'
})
export class DishService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/dishes`;

  query(query: any, page: number, size: number): Observable<ApiResponse<PageResponse<Dish>>> {
    let params = new HttpParams()
      .set('page', (page + 1).toString())
      .set('size', size.toString());

    if (query && query.keyword) {
      params = params.set('keyword', query.keyword);
    }

    return this.http.get<ApiResponse<PageResponse<Dish>>>(this.apiUrl, { params });
  }

  add(form: DishCreateRequest): Observable<ApiResponse<Dish>> {
    return this.http.post<ApiResponse<Dish>>(this.apiUrl, form);
  }

  edit(id: number | string, form: DishUpdateRequest): Observable<ApiResponse<Dish>> {
    return this.http.put<ApiResponse<Dish>>(`${this.apiUrl}/${id}`, form);
  }

  delete(id: number | string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
