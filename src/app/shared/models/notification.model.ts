import { User } from './user.model';

export interface Notification {
  id?: number;
  user?: User;
  title: string;
  content: string;
  isRead: boolean;
  createdAt?: string; // ISO Date string
}

export interface NotificationSendRequest {
  userId?: number;
  title: string;
  content: string;
}

export interface NotificationResponse {
  id: number;
  userId: number;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}
