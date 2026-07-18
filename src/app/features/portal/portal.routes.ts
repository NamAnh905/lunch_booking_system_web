import { Routes } from '@angular/router';
import { pendingChangesGuard } from '@core/guards/pending-changes.guard';

export const portalRoutes: Routes = [
  {
    path: 'meal-order',
    loadComponent: () => import('./meal-order/meal-order.component').then(m => m.MealOrderComponent),
    title: 'Đăng ký cơm trưa - LunchOrder',
    canDeactivate: [pendingChangesGuard]
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
