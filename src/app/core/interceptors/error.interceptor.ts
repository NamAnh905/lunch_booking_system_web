import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // If we receive a 401 Unauthorized or 403 Forbidden, and it's not the login request
      if ((error.status === 401 || error.status === 403) && !req.url.includes('/auth/login')) {
        // If it is the refresh or logout request itself that failed, clear session and redirect
        if (req.url.includes('/auth/refresh') || req.url.includes('/auth/logout')) {
          // Only call local clearSession, do not trigger another HTTP logout if refresh already failed
          // But since clearSession is private in AuthService, we can just let the catchError in logout/refresh handle it,
          // or we can call router navigate directly.
          if (req.url.includes('/auth/refresh')) {
            router.navigate(['/login']);
            toastService.showError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
          }
          return throwError(() => error);
        }

        // Try to silently refresh the token
        return authService.refresh().pipe(
          switchMap(() => {
            // Retry the original request with credentials
            return next(req.clone({ withCredentials: true }));
          }),
          catchError((refreshError) => {
            // If refresh fails, session is completely expired. Log out locally and redirect.
            router.navigate(['/login']);
            toastService.showError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
            return throwError(() => refreshError);
          })
        );
      }
      
      // Global Error Toast for other errors
      let errorMsg = 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';
      if (error.error && error.error.message) {
         errorMsg = error.error.message;
      } else if (error.message) {
         errorMsg = error.message;
      }
      toastService.showError(errorMsg);
      
      return throwError(() => error);
    })
  );
};
