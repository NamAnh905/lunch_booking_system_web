import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { MenuService } from './menu.service';
import { PriceService } from '../price/price.service';
import { DishService } from '../dish/dish.service';
import { Menu, MenuCreateRequest, MenuUpdateRequest } from '@shared/models/menu.model';
import { PriceResponse } from '@shared/models/price.model';
import { Dish } from '@shared/models/dish.model';
import { ApiResponse } from '@shared/models';
import { unwrapPage } from '@shared/utils/api.util';

@Injectable()
export class MenuFacade {
  private menuService = inject(MenuService);
  private priceService = inject(PriceService);
  private dishService = inject(DishService);

  /** Danh sách giá đang active, loại bỏ giá "sáng" (bữa sáng). */
  loadActivePrices(): Observable<PriceResponse[]> {
    return this.priceService.getPrices(1, 100).pipe(
      map((res) =>
        unwrapPage<PriceResponse>(res).data.filter((p) => p.isActive && !p.name.toLowerCase().includes('sáng'))
      )
    );
  }

  loadActiveDishes(): Observable<Dish[]> {
    return this.dishService.getAll().pipe(map((res) => unwrapPage<Dish>(res).data.filter((d) => d.isActive)));
  }

  /** Thực đơn trong tuần, map theo key `${menuDate}_${priceId}` để tra cứu nhanh. */
  loadWeekMenus(startDate: string, endDate: string): Observable<Record<string, Menu>> {
    return this.menuService.getWeeklyMenus(startDate, endDate).pipe(
      map((res: any) => {
        const grid: Record<string, Menu> = {};
        (res.result || []).forEach((menu: Menu) => {
          if (menu.price && menu.price.id) {
            grid[`${menu.menuDate}_${menu.price.id}`] = menu;
          }
        });
        return grid;
      }),
      catchError(() => of({} as Record<string, Menu>))
    );
  }

  /** Lưu danh sách món cho một ô: cập nhật nếu ô đã có thực đơn, ngược lại tạo mới. */
  saveMenuDishes(menu: Menu | undefined, dateStr: string, priceId: number, dishIds: number[]): Observable<ApiResponse<Menu>> {
    if (menu) {
      const updateReq: MenuUpdateRequest = {
        menuDate: menu.menuDate,
        priceId: menu.price!.id,
        status: menu.status || 'ACTIVE',
        dishIds,
      };
      return this.menuService.edit(menu.id!, updateReq);
    }

    const createReq: MenuCreateRequest = {
      menuDate: dateStr,
      priceId,
      status: 'ACTIVE',
      dishIds,
    };
    return this.menuService.add(createReq);
  }

  deleteMenu(id: number): Observable<ApiResponse<void>> {
    return this.menuService.delete(id);
  }

  /** Đổi trạng thái thực đơn (ACTIVE <-> INACTIVE), giữ nguyên món hiện có. */
  updateStatus(menu: Menu, newStatus: string): Observable<ApiResponse<Menu>> {
    const req: MenuUpdateRequest = {
      menuDate: menu.menuDate,
      priceId: menu.price!.id,
      status: newStatus,
      dishIds: menu.dishes ? menu.dishes.map((d: any) => d.id) : [],
    };
    return this.menuService.edit(menu.id!, req);
  }

  exportExcel(): Observable<Blob> {
    return this.menuService.exportExcel();
  }
}
