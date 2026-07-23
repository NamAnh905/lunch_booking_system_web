import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { shareReplay, catchError, switchMap } from 'rxjs/operators';
import { environment } from '@env/environment';
import { ApiResponse, OrderResponse, OrderCreateRequest, MenuResponse, PriceResponse, PageResponse } from '@shared/models';
import { DepartmentMemberOrder } from '@shared/models/meal-order.model';

@Injectable({
  providedIn: 'root'
})
export class MealOrderService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  private weeklyMenusCache$: Observable<ApiResponse<MenuResponse[]>> | null = null;
  private activePricesCache$: Observable<ApiResponse<PriceResponse[]>> | null = null;
  
  private refreshWeeklyMenus$ = new BehaviorSubject<void>(undefined);
  private refreshActivePrices$ = new BehaviorSubject<void>(undefined);

  getMyOrders(fromDate: string, toDate: string): Observable<ApiResponse<OrderResponse[]>> {
    return this.http.get<ApiResponse<OrderResponse[]>>(`${this.apiUrl}/orders/me`, {
      params: { fromDate, toDate }
    });
  }

  createOrders(request: OrderCreateRequest): Observable<ApiResponse<OrderResponse[]>> {
    return this.http.post<ApiResponse<OrderResponse[]>>(`${this.apiUrl}/orders`, request);
  }

  cancelOrder(orderId: number): Observable<ApiResponse<OrderResponse>> {
    return this.http.patch<ApiResponse<OrderResponse>>(`${this.apiUrl}/orders/${orderId}/cancel`, {});
  }

  getDepartmentToday(): Observable<ApiResponse<DepartmentMemberOrder[]>> {
    return this.http.get<ApiResponse<DepartmentMemberOrder[]>>(`${this.apiUrl}/orders/department-today`);
  }

  getMenus(): Observable<ApiResponse<PageResponse<MenuResponse>>> {
    return this.http.get<ApiResponse<PageResponse<MenuResponse>>>(`${this.apiUrl}/portal/menus`, {
      params: { size: 100 }
    });
  }

  getMenusByDate(date: string): Observable<ApiResponse<MenuResponse[]>> {
    return this.http.get<ApiResponse<MenuResponse[]>>(`${this.apiUrl}/portal/menus/by-date`, {
      params: { date }
    });
  }

  getWeeklyMenus(startDate: string, endDate: string): Observable<ApiResponse<MenuResponse[]>> {
    if (!this.weeklyMenusCache$) {
      this.weeklyMenusCache$ = this.refreshWeeklyMenus$.pipe(
        switchMap(() => this.http.get<ApiResponse<MenuResponse[]>>(`${this.apiUrl}/portal/menus/weekly`, {
          params: { startDate, endDate }
        })),
        shareReplay(1),
        catchError(error => {
          this.weeklyMenusCache$ = null;
          return throwError(() => error);
        })
      );
    }
    return this.weeklyMenusCache$;
  }

  getActivePrices(): Observable<ApiResponse<PriceResponse[]>> {
    if (!this.activePricesCache$) {
      this.activePricesCache$ = this.refreshActivePrices$.pipe(
        switchMap(() => this.http.get<ApiResponse<PriceResponse[]>>(`${this.apiUrl}/admin/prices/active`)),
        shareReplay(1),
        catchError(error => {
          this.activePricesCache$ = null;
          return throwError(() => error);
        })
      );
    }
    return this.activePricesCache$;
  }

  clearMenuCache(): void {
    this.weeklyMenusCache$ = null;
    this.activePricesCache$ = null;
    this.refreshWeeklyMenus$.next();
    this.refreshActivePrices$.next();
  }
}
