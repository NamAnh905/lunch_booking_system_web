import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PageResponse, TicketExchangeCreateRequest, TicketExchangeResponse } from '@shared/models';

@Injectable({
  providedIn: 'root'
})
export class TicketExchangeService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/tickets/market`;

  getMarketTickets(page: number = 1, size: number = 10, status?: string | null, keyword?: string | null): Observable<ApiResponse<PageResponse<TicketExchangeResponse>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (status) {
      params = params.set('status', status);
    }
    if (keyword) {
      params = params.set('keyword', keyword);
    }
    return this.http.get<ApiResponse<PageResponse<TicketExchangeResponse>>>(this.apiUrl, { params });
  }

  getMyListedTickets(): Observable<ApiResponse<TicketExchangeResponse[]>> {
    return this.http.get<ApiResponse<TicketExchangeResponse[]>>(`${this.apiUrl}/my-tickets`);
  }

  postTicket(request: TicketExchangeCreateRequest): Observable<ApiResponse<TicketExchangeResponse>> {
    return this.http.post<ApiResponse<TicketExchangeResponse>>(this.apiUrl, request);
  }

  withdrawTicket(exchangeId: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.apiUrl}/${exchangeId}`);
  }

  claimTicket(exchangeId: number): Observable<ApiResponse<TicketExchangeResponse>> {
    return this.http.post<ApiResponse<TicketExchangeResponse>>(`${this.apiUrl}/${exchangeId}/claim`, {});
  }
}