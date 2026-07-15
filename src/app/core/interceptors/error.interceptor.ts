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
import { ToastService } from '../services/toast.service';

// Module-level state shared across every interceptor invocation so that a burst
// of concurrent 401s triggers exactly ONE /auth/refresh call. Followers wait on
// refreshResult$ and replay their request once the single refresh resolves.
let isRefreshing = false;
// null = a refresh is in progress (no result yet); true/false = last outcome.
const refreshResult$ = new BehaviorSubject<boolean | null>(null);

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // A 401 on the refresh/logout call itself means the session is truly dead.
      // Let AuthService.clearSession + the waiters handle it; just surface it.
      if (
        error.status === 401 &&
        (req.url.includes('/auth/refresh') || req.url.includes('/auth/logout'))
      ) {
        return throwError(() => error);
      }

      // 401 on any other protected request (not login) → attempt a single-flight refresh.
      if (error.status === 401 && !req.url.includes('/auth/login')) {
        return handle401(req, next, authService, router, toastService);
      }

      // 403 = authenticated but insufficient permission. Refreshing won't help and
      // would needlessly rotate a still-valid token, so do NOT log the user out.
      if (error.status === 403) {
        toastService.showError('Bạn không có quyền thực hiện thao tác này.');
        return throwError(() => error);
      }

      // Global error toast for everything else.
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

function handle401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  router: Router,
  toastService: ToastService
): Observable<HttpEvent<unknown>> {
  // A refresh is already in flight: queue this request until it resolves.
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

  // This request wins the race and performs the one and only refresh.
  isRefreshing = true;
  refreshResult$.next(null);

  return authService.refresh().pipe(
    switchMap(() => {
      isRefreshing = false;
      refreshResult$.next(true); // wake queued requests → they replay
      return next(req.clone({ withCredentials: true }));
    }),
    catchError((refreshError) => {
      isRefreshing = false;
      refreshResult$.next(false); // wake queued requests → they fail out
      router.navigate(['/login']);
      toastService.showError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
      return throwError(() => refreshError);
    })
  );
}
