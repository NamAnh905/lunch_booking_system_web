import { User } from './user.model';
import { Order } from './order.model';

export interface TicketExchange {
  id?: number;
  order?: Order;
  buyer?: User;
  status: string;
  createdAt?: string;
}

export interface TicketExchangeCreateRequest {
  orderId: number;
}

export interface TicketExchangeResponse {
  exchangeId: number;
  orderId: number;
  sellerName: string;
  sellerId: number;
  menuDate: string;
  isSpecial: boolean;
  status: string;
  createdAt: string;
  buyerId?: number;
  buyerName?: string;
}
