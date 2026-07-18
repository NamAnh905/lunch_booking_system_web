import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  BehaviorSubject,
  Observable,
  catchError,
  filter,
  switchMap,
  take,
  throwError,
} from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ErrorHandlerService } from '../services/error-handler.service';
import { ToastService } from '../services/toast.service';
import { SKIP_ERROR_TOAST } from './http-context.tokens';

let isRefreshing = false;
const refreshResult$ = new BehaviorSubject<boolean | null>(null);

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);
  const errorHandler = inject(ErrorHandlerService);
  const skipToast = req.context.get(SKIP_ERROR_TOAST);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (
        error.status === 401 &&
        (req.url.includes('/auth/refresh') || req.url.includes('/auth/logout'))
      ) {
        return throwError(() => error);
      }

      if (error.status === 401 && !req.url.includes('/auth/login')) {
        return handle401(req, next, authService, router, toastService);
      }

      if (error.status === 403) {
        if (!skipToast) {
          toastService.showError(errorHandler.getMessage(error));
        }
        return throwError(() => error);
      }

      if (req.url.includes('/auth/login')) {
        return throwError(() => error);
      }

      if (!skipToast) {
        toastService.showError(errorHandler.getMessage(error));
      }

      return throwError(() => error);
    })
  );
};

function handle401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  router: Router,
  toastService: ToastService
): Observable<HttpEvent<unknown>> {
  if (isRefreshing) {
    return refreshResult$.pipe(
      filter((result): result is boolean => result !== null),
      take(1),
      switchMap((success) => {
        if (success) {
          return next(req.clone({ withCredentials: true }));
        }
        return throwError(() => new HttpErrorResponse({ status: 401 }));
      })
    );
  }

  isRefreshing = true;
  refreshResult$.next(null);

  return authService.refresh().pipe(
    switchMap(() => {
      isRefreshing = false;
      refreshResult$.next(true);
      return next(req.clone({ withCredentials: true }));
    }),
    catchError((refreshError) => {
      isRefreshing = false;
      refreshResult$.next(false);
      router.navigate(['/login']);
      toastService.showError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
      return throwError(() => refreshError);
    })
  );
}
