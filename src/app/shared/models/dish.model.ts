import { BaseEntity } from './base.model';
import { DishType } from '@shared/enums/dish-type.enum';

export { DishType };

export interface Dish extends BaseEntity {
  id?: number;
  name: string;
  description?: string;
  isActive: boolean;
  type: DishType;
}

export interface DishCreateRequest {
  name: string;
  description?: string;
  isActive?: boolean;
  type: DishType;
}

export interface DishUpdateRequest {
  name: string;
  description?: string;
  isActive: boolean;
  type: DishType;
}

export interface DishResponse {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  type: DishType;
}
