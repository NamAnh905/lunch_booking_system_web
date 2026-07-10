import { BaseEntity } from './base.model';

export type DishType = 'REGULAR' | 'SPECIAL' | 'DRINK' | 'VEGETABLE' | 'SOUP' | 'RICE';

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
