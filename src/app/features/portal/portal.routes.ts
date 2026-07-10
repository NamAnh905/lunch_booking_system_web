import { Routes } from '@angular/router';

export const portalRoutes: Routes = [
  {
    path: 'meal-order',
    loadComponent: () => import('./meal-order/meal-order.component').then(m => m.MealOrderComponent),
    title: 'Đăng ký cơm trưa - LunchOrder'
  },
  {
    path: 'ticket-exchange',
    loadComponent: () => import('./ticket-exchange/ticket-exchange.component').then(m => m.TicketExchangeComponent),
    title: 'Chợ vé - LunchOrder'
  },
  {
    path: '',
    redirectTo: 'meal-order',
    pathMatch: 'full'
  }
];
