import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { ApiResponse, OrderResponse, OrderCreateRequest, MenuResponse } from '@shared/models';

@Injectable({
  providedIn: 'root'
})
export class MealOrderService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getMyOrders(fromDate: string, toDate: string): Observable<ApiResponse<OrderResponse[]>> {
    return this.http.get<ApiResponse<OrderResponse[]>>(`${this.apiUrl}/orders/me`, {
      params: { fromDate, toDate }
    });
  }

  createOrders(request: OrderCreateRequest): Observable<ApiResponse<OrderResponse[]>> {
    return this.http.post<ApiResponse<OrderResponse[]>>(`${this.apiUrl}/orders`, request);
  }

  cancelOrder(orderId: number): Observable<ApiResponse<OrderResponse>> {
    return this.http.put<ApiResponse<OrderResponse>>(`${this.apiUrl}/orders/${orderId}/cancel`, {});
  }

  getMenus(date?: string): Observable<ApiResponse<any>> {
    const params: any = {};
    if (date) {
      params.date = date;
    }
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/admin/menus`, { params });
  }
}
