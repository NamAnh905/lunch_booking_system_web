import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { PageResponse, ApiResponse } from '@shared/models';
import {
  GuestMealResponse,
  GuestMealCreateRequest,
  GuestMealUpdateRequest,
  GuestMealQuery
} from '@shared/models/guest-meal.model';

@Injectable({
  providedIn: 'root'
})
export class GuestMealService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin/guest-meals`;

  getGuestMeals(page: number, size: number, query: GuestMealQuery = {}): Observable<ApiResponse<PageResponse<GuestMealResponse>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (query.startDate) {
      params = params.set('startDate', query.startDate);
    }
    if (query.endDate) {
      params = params.set('endDate', query.endDate);
    }
    if (query.departmentId) {
      params = params.set('departmentId', query.departmentId.toString());
    }
    if (query.requestedByUserId) {
      params = params.set('requestedByUserId', query.requestedByUserId.toString());
    }

    return this.http.get<ApiResponse<PageResponse<GuestMealResponse>>>(this.apiUrl, { params });
  }

  createGuestMeal(data: GuestMealCreateRequest): Observable<ApiResponse<GuestMealResponse>> {
    return this.http.post<ApiResponse<GuestMealResponse>>(this.apiUrl, data);
  }

  updateGuestMeal(id: number, data: GuestMealUpdateRequest): Observable<ApiResponse<GuestMealResponse>> {
    return this.http.put<ApiResponse<GuestMealResponse>>(`${this.apiUrl}/${id}`, data);
  }

  deleteGuestMeal(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
