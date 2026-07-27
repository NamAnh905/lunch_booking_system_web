import { Routes } from '@angular/router';
import { roleGuard } from '@core/guards/role.guard';
import { ROLES } from '@shared/constants/role.constants';

export const statisticRoutes: Routes = [
    {
        path: '',
        redirectTo: 'order-monthly',
        pathMatch: 'full'
    },
    {
        path: 'order-monthly',
        data: { breadcrumb: 'Thống kê theo tháng', expectedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
        canActivate: [roleGuard],
        title: 'Thống kê theo tháng',
        loadComponent: () => import('./order-monthly/order-monthly.component').then(m => m.OrderMonthlyComponent)
    },
    {
        path: 'order-daily',
        data: { breadcrumb: 'Thống kê theo ngày', expectedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
        canActivate: [roleGuard],
        title: 'Thống kê theo ngày',
        loadComponent: () => import('./order-daily/order-daily.component').then(m => m.OrderDailyComponent)
    }
];
