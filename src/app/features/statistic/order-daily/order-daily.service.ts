import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DailyOrderSummaryResponse } from '../../../shared/models/order-summary.model';
import { AdminOrderListResponse } from '../../../shared/models/order.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderDailyService {
  private summaryUrl = `${environment.apiUrl}/admin/order-summary/daily`;
  private adminOrderUrl = `${environment.apiUrl}/admin/orders`;

  constructor(private http: HttpClient) {}

  getDailySummary(date: string, departmentId?: number): Observable<{ result: DailyOrderSummaryResponse }> {
    let params = new HttpParams().set('date', date);
    if (departmentId) {
      params = params.set('departmentId', departmentId.toString());
    }
    return this.http.get<{ result: DailyOrderSummaryResponse }>(this.summaryUrl, { params });
  }

  getAdminOrders(date: string, status?: string): Observable<{ result: AdminOrderListResponse }> {
    let params = new HttpParams().set('date', date);
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<{ result: AdminOrderListResponse }>(this.adminOrderUrl, { params });
  }

  exportDailyExcel(date: string, departmentId?: number): Observable<Blob> {
    let params = new HttpParams().set('date', date);
    if (departmentId) {
      params = params.set('departmentId', departmentId.toString());
    }
    return this.http.get<Blob>(`${this.summaryUrl}/export`, {
      params,
      responseType: 'blob' as 'json'
    });
  }
}
