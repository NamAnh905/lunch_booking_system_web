import { Routes } from '@angular/router';

export const systemRoutes: Routes = [
    {
        path: 'statistics',
        data: { breadcrumb: 'Thống kê' },
        children: [
            {
                path: 'order-monthly',
                data: { breadcrumb: 'Thống kê theo tháng' },
                title: 'Thống kê theo tháng',
                loadComponent: () => import('../../shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent)
            },
            {
                path: 'order-daily',
                data: { breadcrumb: 'Thống kê theo ngày' },
                title: 'Thống kê theo ngày',
                loadComponent: () => import('../../shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent)
            }
        ]
    },
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
                loadComponent: () => import('./role/role.component').then(m => m.RoleComponent)
            },
            {
                path: 'permission',
                data: { breadcrumb: 'Quyền' },
                title: 'Quyền',
                loadComponent: () => import('./permission/permission.component').then(m => m.PermissionComponent)
            },
            {
                path: 'department',
                data: { breadcrumb: 'Phòng ban' },
                title: 'Phòng ban',
                loadComponent: () => import('./department/department.component').then(m => m.DepartmentComponent)
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
                loadComponent: () => import('../../shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent)
            },
            {
                path: 'feedback',
                data: { breadcrumb: 'Phản hồi' },
                title: 'Phản hồi',
                loadComponent: () => import('../../shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent)
            },
            {
                path: 'notification',
                data: { breadcrumb: 'Thông báo' },
                title: 'Thông báo',
                loadComponent: () => import('../../shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent)
            }
        ]
    },
    {
        path: 'profile',
        data: { breadcrumb: 'Thông tin cá nhân' },
        title: 'Thông tin cá nhân',
        loadComponent: () => import('../../shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent)
    }
];
