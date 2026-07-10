import { Routes } from '@angular/router';

export const statisticRoutes: Routes = [
    {
        path: '',
        redirectTo: 'order-monthly',
        pathMatch: 'full'
    },
    {
        path: 'order-monthly',
        data: { breadcrumb: 'Thống kê theo tháng' },
        title: 'Thống kê theo tháng',
        loadComponent: () => import('./order-monthly/order-monthly.component').then(m => m.OrderMonthlyComponent)
    },
    {
        path: 'order-daily',
        data: { breadcrumb: 'Thống kê theo ngày' },
        title: 'Thống kê theo ngày',
        loadComponent: () => import('./order-daily/order-daily.component').then(m => m.OrderDailyComponent)
    }
];
