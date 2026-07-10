import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent),
    title: 'Đăng nhập - LunchOrder'
  },
  {
    path: '',
    loadComponent: () => import('./core/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: '/login',
        pathMatch: 'full'
      },
      {
        path: 'statistic',
        data: { breadcrumb: 'Thống kê' },
        loadChildren: () => import('./features/statistic/statistic.routes').then(m => m.statisticRoutes)
      },
      {
        path: 'portal',
        loadChildren: () => import('./features/portal/portal.routes').then(m => m.portalRoutes)
      },
      {
        path: 'system',
        data: { breadcrumb: 'SKIP' },
        loadChildren: () => import('./features/system/system.routes').then(m => m.systemRoutes)
      }
    ]
  },
  {
    path: '401',
    loadComponent: () => import('./shared/components/error/401.component').then(m => m.UnAuthorizedComponent),
    title: 'Truy cập bị từ chối - LunchOrder'
  },
  {
    path: '404',
    loadComponent: () => import('./shared/components/error/404.component').then(m => m.NotFoundComponent),
    title: 'Không tìm thấy trang - LunchOrder'
  },
  {
    path: '**',
    loadComponent: () => import('./shared/components/error/404.component').then(m => m.NotFoundComponent),
    title: 'Không tìm thấy trang - LunchOrder'
  }
];
