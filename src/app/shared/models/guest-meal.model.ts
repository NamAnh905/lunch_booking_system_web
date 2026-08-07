import { BaseEntity } from './base.model';

export interface GuestMealResponse extends BaseEntity {
  id: number;
  mealDate: string;
  departmentId: number;
  departmentName: string;
  requestedByUserId: number;
  requestedByFullName: string;
  normalQuantity: number;
  specialQuantity: number;
  normalUnitPrice: number;
  specialUnitPrice: number;
  totalAmount: number;
  note?: string;
}

export interface GuestMealCreateRequest {
  mealDate: string;
  departmentId: number | null;
  requestedByUserId: number | null;
  normalQuantity: number;
  specialQuantity: number;
  note?: string;
}

export type GuestMealUpdateRequest = GuestMealCreateRequest;

export interface GuestMealQuery {
  startDate?: string;
  endDate?: string;
  departmentId?: number | null;
  requestedByUserId?: number | null;
}
