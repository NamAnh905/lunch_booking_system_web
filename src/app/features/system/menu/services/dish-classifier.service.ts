import { Injectable } from '@angular/core';
import { Dish } from '@shared/models/dish.model';
import { DishType } from '@shared/enums/dish-type.enum';

/**
 * Phân loại món ăn theo `type` do BE trả về (BE luôn gán `type`, mặc định REGULAR).
 * Suất đặc biệt (SPECIAL) được xếp vào slot món thường nên map về REGULAR.
 * Trích từ `MenuComponent.getDishType` / `isDrink`.
 */
@Injectable({ providedIn: 'root' })
export class DishClassifierService {
  getDishType(dish: Dish): DishType {
    if (!dish?.type) return DishType.REGULAR;
    if (dish.type === DishType.SPECIAL) return DishType.REGULAR;
    return dish.type;
  }

  isDrink(dish: Dish): boolean {
    return dish?.type === DishType.DRINK;
  }
}
