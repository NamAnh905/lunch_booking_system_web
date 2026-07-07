import { User } from './user.model';
import { Menu } from './menu.model';

export interface Order {
  id?: number;
  user?: User;
  menu?: Menu;
  price: number;
  status: string;
  ticketSource?: string;
  originalUser?: User;
  isPrinted: boolean;
  createdAt?: string; // ISO Date string
  updatedBy?: number;
  updatedAt?: string; // ISO Date string
}

export interface OrderCreateRequest {
  menuIds: number[];
}

export interface OrderStatusUpdateRequest {
  status: string;
}

export interface OrderTransferRequest {
  targetUserId: number;
  note?: string;
}

export interface OrderResponse {
  id: number;
  userId: number;
  menuId: number;
  menuDate: string;
  price: number;
  status: string;
  ticketSource: string;
  isSpecial: boolean;
  originalUserId?: number;
  isPrinted: boolean;
  errorMessage?: string;
  createdAt?: string;
}

export interface AdminOrderListResponse {
  totalCount: number;
  orders: OrderResponse[];
}
