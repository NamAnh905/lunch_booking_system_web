import { BaseEntity } from './base.model';
import { Dish, DishResponse } from './dish.model';
import { PriceResponse } from './price.model';

export interface Menu extends BaseEntity {
  id?: number;
  menuDate: string; // YYYY-MM-DD
  price?: PriceResponse;
  status?: string;
  dishes?: Dish[];
}

export interface MenuCreateRequest {
  menuDate: string; // YYYY-MM-DD
  priceId: number;
  status: string;
  dishIds?: number[];
}

export interface MenuUpdateRequest {
  menuDate: string; // YYYY-MM-DD
  priceId: number;
  status: string;
  dishIds?: number[];
}

export interface MenuResponse {
  id: number;
  menuDate: string;
  price: PriceResponse;
  status: string;
  dishes: DishResponse[];
}
