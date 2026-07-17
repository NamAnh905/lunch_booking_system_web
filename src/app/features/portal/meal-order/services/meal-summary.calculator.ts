import { Injectable } from '@angular/core';
import { CalendarDay } from '@shared/models/meal-order.model';

export interface MealPrices {
  normal: number;
  special: number;
}

export interface MealSummary {
  totalDaysEat: number;
  totalDaysSpecial: number;
  totalPrice: number;
}

@Injectable({ providedIn: 'root' })
export class MealSummaryCalculator {
  calculate(days: CalendarDay[], prices: MealPrices): MealSummary {
    let totalDaysEat = 0;
    let totalDaysSpecial = 0;
    let totalPrice = 0;

    for (const day of days) {
      if (day.dayNumber && day.isRegistered) {
        totalDaysEat++;
        if (day.isSpecial) {
          totalDaysSpecial++;
          totalPrice += prices.special;
        } else {
          totalPrice += prices.normal;
        }
      }
    }

    return { totalDaysEat, totalDaysSpecial, totalPrice };
  }
}
