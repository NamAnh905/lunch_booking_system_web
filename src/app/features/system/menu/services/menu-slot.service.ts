import { Injectable, inject } from '@angular/core';
import { Dish } from '@shared/models/dish.model';
import { Menu } from '@shared/models/menu.model';
import { PriceResponse } from '@shared/models/price.model';
import { MEAL_PRICE } from '@shared/constants/business.constants';
import { DishType } from '@shared/enums/dish-type.enum';
import { DishClassifierService } from './dish-classifier.service';

export interface MenuSlot {
  expectedType: DishType;
  dish?: Dish;
  label: string;
}

/**
 * Logic bố trí món ăn vào các "slot" của một ô thực đơn và kiểm tra hợp lệ.
 * Trích từ `MenuComponent.getMenuSlots` / `validateDishForSlot` / `isSpecialPrice`.
 */
@Injectable({ providedIn: 'root' })
export class MenuSlotService {
  private classifier = inject(DishClassifierService);

  isSpecialPrice(price: PriceResponse): boolean {
    if (!price || !price.name) return false;
    const name = price.name.toLowerCase();
    return name.includes('đặc biệt') || name.includes('vip') || price.amount === MEAL_PRICE.SPECIAL;
  }

  getMenuSlots(menu: Menu | undefined, dayName: string, price: PriceResponse): MenuSlot[] {
    const isSpecial = this.isSpecialPrice(price);

    if (isSpecial) {
      if (dayName !== 'Thứ sáu') {
        return [];
      }
      const dish = menu?.dishes && menu.dishes.length > 0 ? menu.dishes[0] : undefined;
      return [{ expectedType: DishType.REGULAR, dish, label: 'Thêm món ăn' }];
    }

    const slotDefs: { type: DishType; label: string }[] = [
      { type: DishType.REGULAR, label: 'Thêm món ăn' },
      { type: DishType.REGULAR, label: 'Thêm món ăn' },
      { type: DishType.VEGETABLE, label: 'Thêm rau' },
      { type: DishType.VEGETABLE, label: 'Thêm rau' },
      { type: DishType.SOUP, label: 'Thêm canh' },
      { type: DishType.RICE, label: 'Thêm cơm' },
      { type: DishType.DRINK, label: 'Thêm nước' },
    ];

    const mappedSlots: MenuSlot[] = slotDefs.map((def) => ({
      expectedType: def.type,
      dish: undefined,
      label: def.label,
    }));

    if (menu && menu.dishes) {
      const unassignedDishes: (Dish | null)[] = [...menu.dishes];

      // Pass 1: khớp đúng loại.
      for (let i = 0; i < unassignedDishes.length; i++) {
        const dish = unassignedDishes[i];
        if (!dish) continue;
        const dType = this.classifier.getDishType(dish);
        const slot = mappedSlots.find((s) => !s.dish && s.expectedType === dType);
        if (slot) {
          slot.dish = dish;
          unassignedDishes[i] = null;
        }
      }

      // Pass 2: nhét phần còn lại vào slot trống.
      for (const dish of unassignedDishes) {
        if (!dish) continue;
        const emptySlot = mappedSlots.find((s) => !s.dish);
        if (emptySlot) {
          emptySlot.dish = dish;
        }
      }
    }

    return mappedSlots;
  }

  /**
   * Kiểm tra một món có được phép đặt vào slot không.
   * Trả về thông báo lỗi (string) nếu không hợp lệ, hoặc `null` nếu hợp lệ.
   */
  validateDishForSlot(
    dish: Dish,
    slots: MenuSlot[],
    slotIndex: number,
    expectedType: DishType
  ): string | null {
    const isDuplicate = slots.some((s, idx) => s.dish && s.dish.id === dish.id && idx !== slotIndex);
    if (isDuplicate) {
      return `Món "${dish.name}" đã tồn tại trong thực đơn này!`;
    }

    if (expectedType !== DishType.DRINK) {
      const isTofu = dish.name.toLowerCase().includes('đậu');
      if (isTofu) {
        if (slotIndex === 0) {
          for (let i = 1; i <= 5; i++) {
            if (slots[i] && slots[i].dish && slots[i].dish!.name.toLowerCase().includes('đậu')) {
              return `Vì hàng khác đã có món chứa "đậu", hàng đầu tiên không thể là món "đậu"!`;
            }
          }
        } else if (slotIndex > 0 && slotIndex <= 5) {
          if (slots[0] && slots[0].dish && slots[0].dish!.name.toLowerCase().includes('đậu')) {
            return `Vì hàng đầu tiên đã là món chứa "đậu", các hàng còn lại không thể chọn món "đậu" nữa!`;
          }
        }
      }
    }

    return null;
  }
}
