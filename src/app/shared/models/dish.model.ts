import { BaseEntity } from './base.model';

export interface Dish extends BaseEntity {
  id?: number;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface DishCreateRequest {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface DishUpdateRequest {
  name: string;
  description?: string;
  isActive: boolean;
}

export interface DishResponse {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
}
