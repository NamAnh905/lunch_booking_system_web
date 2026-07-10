import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PageResponse } from '../../../shared/models/base.model';
import { TicketExchangeResponse } from '../../../shared/models/ticket-exchange.model';

@Injectable({
  providedIn: 'root'
})
export class MarketService {
  private apiUrl = `${environment.apiUrl}/admin/tickets/exchanges`;

  constructor(private http: HttpClient) {}

  getExchanges(page: number, size: number, startDate?: string, endDate?: string, status?: string, keyword?: string): Observable<ApiResponse<PageResponse<TicketExchangeResponse>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (startDate) {
      params = params.set('startDate', startDate);
    }
    if (endDate) {
      params = params.set('endDate', endDate);
    }
    if (status) {
      params = params.set('status', status);
    }
    if (keyword) {
      params = params.set('keyword', keyword);
    }

    return this.http.get<ApiResponse<PageResponse<TicketExchangeResponse>>>(this.apiUrl, { params });
  }

  forceCancelTicket(exchangeId: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.apiUrl}/${exchangeId}`);
  }
}
