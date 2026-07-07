import { User } from './user.model';
import { Menu } from './menu.model';

export interface Feedback {
  id?: number;
  user?: User;
  menu?: Menu;
  comment: string;
  createdAt?: string; // ISO Date string
}

export interface FeedbackCreateRequest {
  menuId: number;
  comment: string;
}

export interface FeedbackResponse {
  id: number;
  userId: number;
  userFullName: string;
  menuId: number;
  menuDate: string;
  comment: string;
  createdAt: string;
}
