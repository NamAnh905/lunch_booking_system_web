import { BaseEntity } from './base.model';
import { Dish, DishResponse } from './dish.model';
import { PriceResponse } from './price.model';
import { MenuType } from '../enums/menu-type.enum';

export interface Menu extends BaseEntity {
  id?: number;
  name?: string;
  type?: MenuType;
  imageUrl?: string;
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

export interface MenuImageCreateRequest {
  name: string;
  imageUrl: string;
  weekDate: string; // YYYY-MM-DD
}

export interface UploadResponse {
  url: string;
}

export interface MenuResponse {
  id: number;
  name?: string;
  type?: MenuType;
  imageUrl?: string;
  menuDate: string;
  price: PriceResponse;
  status: string;
  dishes: DishResponse[];
  createdAt?: string;
}
