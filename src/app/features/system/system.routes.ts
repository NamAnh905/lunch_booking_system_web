import { Routes } from '@angular/router';
import { superAdminGuard } from '@core/guards/super-admin.guard';

export const systemRoutes: Routes = [

    {
        path: 'admin',
        data: { breadcrumb: 'Hệ thống' },
        children: [
            {
                path: 'user',
                data: { breadcrumb: 'Người dùng' },
                title: 'Người dùng',
                loadComponent: () => import('./user/user.component').then(m => m.UserComponent)
            },
            {
                path: 'role',
                data: { breadcrumb: 'Vai trò' },
                title: 'Vai trò',
                canActivate: [superAdminGuard],
                loadComponent: () => import('./role/role.component').then(m => m.RoleComponent)
            },
            {
                path: 'permission',
                data: { breadcrumb: 'Quyền' },
                title: 'Quyền',
                canActivate: [superAdminGuard],
                loadComponent: () => import('./permission/permission.component').then(m => m.PermissionComponent)
            },
            {
                path: 'department',
                data: { breadcrumb: 'Phòng ban' },
                title: 'Phòng ban',
                loadComponent: () => import('./department/department.component').then(m => m.DepartmentComponent)
            },
            {
                path: 'config',
                data: { breadcrumb: 'Cấu hình hệ thống' },
                title: 'Cấu hình hệ thống',
                canActivate: [superAdminGuard],
                loadComponent: () => import('./config/config.component').then(m => m.ConfigComponent)
            }
        ]
    },
    {
        path: 'meal',
        data: { breadcrumb: 'Quản lý suất ăn' },
        children: [
            {
                path: 'menu',
                data: { breadcrumb: 'Thực đơn' },
                title: 'Thực đơn',
                loadComponent: () => import('./menu/menu.component').then(m => m.MenuComponent)
            },
            {
                path: 'dish',
                data: { breadcrumb: 'Món ăn' },
                title: 'Món ăn',
                loadComponent: () => import('./dish/dish.component').then(m => m.DishComponent)
            },
            {
                path: 'price',
                data: { breadcrumb: 'Giá' },
                title: 'Giá',
                loadComponent: () => import('./price/price.component').then(m => m.PriceComponent)
            }
        ]
    },
    {
        path: 'interaction',
        data: { breadcrumb: 'Tương tác' },
        children: [
            {
                path: 'ticket-exchange',
                data: { breadcrumb: 'Trao đổi vé' },
                title: 'Trao đổi vé',
                loadComponent: () => import('./market/market.component').then(m => m.MarketComponent)
            },
            {
                path: 'notification',
                data: { breadcrumb: 'Thông báo' },
                title: 'Thông báo',
                loadComponent: () => import('../../shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent)
            }
        ]
    }
];
