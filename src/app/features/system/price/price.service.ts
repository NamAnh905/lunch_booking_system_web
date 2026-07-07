import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PageResponse, ApiResponse } from '@shared/models';
import { PriceResponse, PriceCreateRequest, PriceUpdateRequest } from '@shared/models/price.model';

@Injectable({
  providedIn: 'root'
})
export class PriceService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin/prices`;

  getPrices(page: number, size: number, keyword?: string): Observable<ApiResponse<PageResponse<PriceResponse>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (keyword) {
      params = params.set('keyword', keyword);
    }

    return this.http.get<ApiResponse<PageResponse<PriceResponse>>>(this.apiUrl, { params });
  }

  createPrice(data: PriceCreateRequest): Observable<ApiResponse<PriceResponse>> {
    return this.http.post<ApiResponse<PriceResponse>>(this.apiUrl, data);
  }

  updatePrice(id: number, data: PriceUpdateRequest): Observable<ApiResponse<PriceResponse>> {
    return this.http.put<ApiResponse<PriceResponse>>(`${this.apiUrl}/${id}`, data);
  }

  deletePrice(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
