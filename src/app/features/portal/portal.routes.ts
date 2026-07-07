import { Routes } from '@angular/router';

export const portalRoutes: Routes = [
  {
    path: 'meal-order',
    loadComponent: () => import('./meal-order/meal-order.component').then(m => m.MealOrderComponent),
    title: 'Đăng ký cơm trưa - LunchOrder'
  },
  {
    path: '',
    redirectTo: 'meal-order',
    pathMatch: 'full'
  }
];
