import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError, concatMap } from 'rxjs/operators';
import { MealOrderService } from './meal-order.service';
import { OrderResponse, OrderItemRequest } from '@shared/models';
import { MealPrices } from './services/meal-summary.calculator';
import { MEAL_PRICE } from '@shared/constants/business.constants';
import { OrderStatus } from '@shared/enums';
import { toIsoDate } from '@shared/utils/date.util';

export interface MonthData {
  orders: OrderResponse[];
  menus: any[];
  orderMap: Record<string, OrderResponse>;
  menuMap: Record<string, any>;
  registeredDates: Set<string>;
}

export interface SaveChanges {
  datesToRegister: OrderItemRequest[];
  ordersToCancel: OrderResponse[];
}

export interface SaveResult {
  changed: boolean;
  hasError: boolean;
}

/**
 * Facade điều phối dữ liệu cho màn đặt suất ăn:
 *  - Nạp giá suất ăn, nạp dữ liệu tháng (kèm cache).
 *  - Chuẩn hoá orders/menus thành map.
 *  - Lưu (đăng ký + huỷ) bằng forkJoin thay cho việc đếm request thủ công.
 *
 * Cung cấp ở cấp component (providers) để cache gắn với vòng đời màn hình.
 */
@Injectable()
export class MealOrderFacade {
  private mealOrderService = inject(MealOrderService);

  /** Cache dữ liệu thô theo tháng: key = `${year}-${month}`. */
  private monthCache: Record<string, { orders: OrderResponse[]; menus: any[] }> = {};

  prices: MealPrices = { normal: MEAL_PRICE.NORMAL, special: MEAL_PRICE.SPECIAL };

  clearCache(): void {
    this.monthCache = {};
  }

  invalidateMonth(year: number, month: number): void {
    delete this.monthCache[`${year}-${month}`];
  }

  loadPrices(): Observable<MealPrices> {
    return this.mealOrderService.getActivePrices().pipe(
      map((res) => {
        if (res?.result && res.result.length > 0) {
          const sorted = [...res.result].sort((a, b) => a.amount - b.amount);
          this.prices = {
            normal: sorted[0].amount,
            special: sorted.length > 1 ? sorted[sorted.length - 1].amount : MEAL_PRICE.SPECIAL,
          };
        } else {
          this.prices = { normal: MEAL_PRICE.NORMAL, special: MEAL_PRICE.SPECIAL };
        }
        return this.prices;
      }),
      catchError(() => {
        this.prices = { normal: MEAL_PRICE.NORMAL, special: MEAL_PRICE.SPECIAL };
        return of(this.prices);
      })
    );
  }

  /** Nạp dữ liệu (đơn + thực đơn) của một tháng, ưu tiên cache. */
  loadMonth(year: number, month: number): Observable<MonthData> {
    const key = `${year}-${month}`;
    const cached = this.monthCache[key];
    if (cached) {
      return of(this.buildMonthData(cached.orders, cached.menus));
    }

    const startStr = toIsoDate(new Date(year, month, 1));
    const endDay = new Date(year, month + 1, 0).getDate();
    const endStr = toIsoDate(new Date(year, month, endDay));

    return forkJoin({
      orders: this.mealOrderService.getMyOrders(startStr, endStr).pipe(catchError(() => of({ result: null } as any))),
      menus: this.mealOrderService.getMenus().pipe(catchError(() => of({ result: null } as any))),
    }).pipe(
      map((res) => {
        const orders: OrderResponse[] = res.orders?.result || [];
        const menus: any[] = Array.isArray(res.menus?.result)
          ? res.menus.result
          : res.menus?.result?.data || res.menus?.result?.content || [];
        this.monthCache[key] = { orders, menus };
        return this.buildMonthData(orders, menus);
      }),
      catchError(() => of(this.buildMonthData([], [])))
    );
  }

  /**
   * Lưu thay đổi đăng ký. Huỷ đơn TRƯỚC (song song với nhau), chờ tất cả hoàn tất
   * rồi mới tạo đơn — bảo đảm khi đổi loại suất (thường <-> đặc biệt) thì đơn cũ đã
   * ở trạng thái CANCELLED để BE upsert lại, tránh lỗi ORDER_ALREADY_EXISTS do race
   * khi cancel + create chạy đồng thời.
   */
  save(changes: SaveChanges): Observable<SaveResult> {
    const { datesToRegister, ordersToCancel } = changes;

    if (datesToRegister.length === 0 && ordersToCancel.length === 0) {
      return of({ changed: false, hasError: false });
    }

    // Mỗi stream trả về `true` nếu lỗi, `false` nếu thành công.
    const cancelStreams = ordersToCancel.map((order) =>
      this.mealOrderService.cancelOrder(order.id).pipe(
        map(() => false),
        catchError(() => of(true))
      )
    );

    // forkJoin([]) không phát giá trị nào — dùng of([]) khi không có đơn cần huỷ.
    const cancels$: Observable<boolean[]> =
      cancelStreams.length > 0 ? forkJoin(cancelStreams) : of([]);

    const create$: Observable<boolean> =
      datesToRegister.length > 0
        ? this.mealOrderService.createOrders({ orders: datesToRegister }).pipe(
            // 'FAILED' là status tổng hợp do BE gắn cho item lỗi (không nằm trong enum OrderStatus).
            map((res) => (res.result?.filter((o) => o.status === 'FAILED') || []).length > 0),
            catchError(() => of(true))
          )
        : of(false);

    return cancels$.pipe(
      concatMap((cancelFlags) =>
        create$.pipe(
          map((createFlag) => ({
            changed: true,
            hasError: cancelFlags.some(Boolean) || createFlag,
          }))
        )
      )
    );
  }

  private buildMonthData(orders: OrderResponse[], menus: any[]): MonthData {
    const orderMap: Record<string, OrderResponse> = {};
    const registeredDates = new Set<string>();

    orders.forEach((order) => {
      if (order.menuDate && order.status !== OrderStatus.CANCELLED) {
        const key = order.menuDate.toString().split('T')[0];
        orderMap[key] = order;
        registeredDates.add(key);
      }
    });

    const menuMap: Record<string, any> = {};
    menus.forEach((menu) => {
      if (menu.menuDate) {
        menuMap[menu.menuDate.toString().split('T')[0]] = menu;
      } else if (menu.date) {
        menuMap[menu.date.toString().split('T')[0]] = menu;
      }
    });

    return { orders, menus, orderMap, menuMap, registeredDates };
  }
}
