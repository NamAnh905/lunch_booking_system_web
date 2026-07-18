import { BaseEntity } from './base.model';
import { User } from './user.model';

export interface Payment extends BaseEntity {
  id?: number;
  user?: User;
  amount: number;
  paymentMethod: string;
  paymentMonth: number;
  paymentYear: number;
  note?: string;
  paidAt?: string;
}

export interface PaymentCreateRequest {
  userId: number;
  amount: number;
  paymentMethod: string;
  paymentMonth: number;
  paymentYear: number;
  note?: string;
}

export interface PaymentResponse {
  id: number;
  userId: number;
  fullName: string;
  amount: number;
  paymentMethod: string;
  paymentMonth: number;
  paymentYear: number;
  note: string;
  paidAt: string;
  createdAt: string;
}
