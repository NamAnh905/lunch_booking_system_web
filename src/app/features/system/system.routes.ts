import { Routes } from '@angular/router';
import { roleGuard } from '@core/guards/role.guard';
import { superAdminGuard } from '@core/guards/super-admin.guard';
import { ROLES } from '@shared/constants/role.constants';

export const systemRoutes: Routes = [

    {
        path: 'admin',
        data: { breadcrumb: 'Hệ thống', expectedRoles: [ROLES.ADMIN, ROLES.SUPER_ADMIN] },
        canActivate: [roleGuard],
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
                loadComponent: () => import('./config/config.component').then(m => m.ConfigComponent)
            },
            {
                path: 'audit-log',
                data: { breadcrumb: 'Nhật ký hoạt động' },
                title: 'Nhật ký hoạt động',
                canActivate: [superAdminGuard],
                loadComponent: () => import('./audit-log/audit-log.component').then(m => m.AuditLogComponent)
            }
        ]
    },
    {
        path: 'meal',
        data: { breadcrumb: 'Quản lý suất ăn', expectedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
        canActivate: [roleGuard],
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
            },
            {
                path: 'guest-meal',
                data: { breadcrumb: 'Suất ăn khách' },
                title: 'Suất ăn khách',
                loadComponent: () => import('./guest-meal/guest-meal.component').then(m => m.GuestMealComponent)
            }
        ]
    },
    {
        path: 'interaction',
        data: { breadcrumb: 'Tương tác', expectedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
        canActivate: [roleGuard],
        children: [
            {
                path: 'ticket-exchange',
                data: { breadcrumb: 'Trao đổi vé' },
                title: 'Trao đổi vé',
                loadComponent: () => import('./market/market.component').then(m => m.MarketComponent)
            }
        ]
    }
];
