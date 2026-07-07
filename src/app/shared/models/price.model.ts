import { BaseEntity } from './base.model';

export interface Price extends BaseEntity {
  id?: number;
  name: string;
  amount: number;
  description?: string;
  isActive: boolean;
}

export interface PriceCreateRequest {
  name: string;
  amount: number;
  description?: string;
  isActive?: boolean;
}

export interface PriceUpdateRequest {
  name: string;
  amount: number;
  description?: string;
  isActive?: boolean;
}

export interface PriceResponse {
  id: number;
  name: string;
  amount: number;
  description: string;
  isActive: boolean;
}
