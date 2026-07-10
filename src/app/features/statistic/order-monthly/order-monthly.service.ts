import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MonthlyOrderSummaryResponse } from '../../../shared/models/order-summary.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderMonthlyService {
  private summaryUrl = `${environment.apiUrl}/admin/order-summary/monthly`;
  private adminOrderUrl = `${environment.apiUrl}/admin/orders`;

  constructor(private http: HttpClient) {}

  getMonthlySummary(month: number, year: number, departmentId?: number): Observable<{ result: MonthlyOrderSummaryResponse }> {
    let params = new HttpParams().set('month', month.toString()).set('year', year.toString());
    if (departmentId) {
      params = params.set('departmentId', departmentId.toString());
    }
    return this.http.get<{ result: MonthlyOrderSummaryResponse }>(this.summaryUrl, { params });
  }

  // NOTE: This API currently doesn't exist in backend as per the required exact match (returning array of dates for a user)
  // But we define it here and will suggest the backend developer to create it: GET /admin/orders/user/{userId}?fromDate=...&toDate=...
  getUserOrders(userId: number, fromDate: string, toDate: string): Observable<{ result: any[] }> {
    let params = new HttpParams().set('fromDate', fromDate).set('toDate', toDate);
    // Suggest backend endpoint: /admin/orders/user/{userId}
    return this.http.get<{ result: any[] }>(`${this.adminOrderUrl}/user/${userId}`, { params });
  }

  exportMonthlyExcel(month: number, year: number, departmentId?: number): Observable<Blob> {
    let params = new HttpParams().set('month', month.toString()).set('year', year.toString());
    if (departmentId) {
      params = params.set('departmentId', departmentId.toString());
    }
    return this.http.get<Blob>(`${this.summaryUrl}/export`, {
      params,
      responseType: 'blob' as 'json'
    });
  }
}
