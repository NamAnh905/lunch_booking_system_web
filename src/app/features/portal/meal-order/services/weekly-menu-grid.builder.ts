import { Injectable } from '@angular/core';
import { toIsoDate, toDisplayDate } from '@shared/utils/date.util';

export interface MenuGridDay {
  date: string;
  dayOfWeek: string;
}

export interface MenuGridRow {
  priceName: string;
  priceAmount: number;
  maxDishes: number;
  dishRows: { dayDishes: string[] }[];
}

export interface WeeklyMenuGrid {
  gridDays: MenuGridDay[];
  menuGrid: MenuGridRow[];
}

@Injectable({ providedIn: 'root' })
export class WeeklyMenuGridBuilder {
  private readonly dayNames = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu'];

  build(menus: any[], monday: Date): WeeklyMenuGrid {
    const gridDays = this.buildGridDays(monday);

    const priceGroups = new Map<number, { name: string; amount: number; menus: any[] }>();
    for (const m of menus) {
      if (!m || !m.price) continue;
      if (m.price.name.toLowerCase().includes('sáng')) continue;

      const priceId = m.price.id;
      if (!priceGroups.has(priceId)) {
        priceGroups.set(priceId, { name: m.price.name, amount: m.price.amount, menus: [] });
      }
      priceGroups.get(priceId)?.menus.push(m);
    }

    const menuGrid: MenuGridRow[] = [];
    priceGroups.forEach((group) => {
      const rowDays = gridDays.map((gd) => {
        const menuForDay = group.menus.find((m) => m.menuDate === gd.date);
        const dishes: string[] = (menuForDay?.dishes || [])
          .filter((d: any) => d != null)
          .map((d: any) => d?.name)
          .filter((name: string) => name);
        return { dishes };
      });

      const maxDishes = Math.max(1, ...rowDays.map((rd) => rd.dishes.length));
      const dishRows: { dayDishes: string[] }[] = [];
      for (let i = 0; i < maxDishes; i++) {
        dishRows.push({ dayDishes: rowDays.map((rd) => rd.dishes[i] || '') });
      }

      menuGrid.push({ priceName: group.name, priceAmount: group.amount, maxDishes, dishRows });
    });

    menuGrid.sort((a, b) => a.priceAmount - b.priceAmount);

    return { gridDays, menuGrid };
  }

  private buildGridDays(monday: Date): MenuGridDay[] {
    const gridDays: MenuGridDay[] = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      gridDays.push({
        date: toIsoDate(d),
        dayOfWeek: `${this.dayNames[i]}, ${toDisplayDate(d)}`,
      });
    }
    return gridDays;
  }
}
