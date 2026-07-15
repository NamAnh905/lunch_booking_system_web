import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { DATE_PIPE_DEFAULT_OPTIONS } from '@angular/common';
import { catchError, of } from 'rxjs';

import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt-interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { AuthService } from './core/auth/auth.service';
import { TokenStorageService } from './core/auth/token.storage.service';
import { APP_DATE_FORMAT } from '@shared/constants/business.constants';

export function initializeApp(authService: AuthService, tokenStorage: TokenStorageService) {
  return () => {
    if (tokenStorage.isLoggedIn()) {
      return authService.refresh().pipe(
        catchError(() => of(null))
      );
    }
    return of(null);
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([jwtInterceptor, errorInterceptor])
    ),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AuthService, TokenStorageService],
      multi: true
    },
    { provide: DATE_PIPE_DEFAULT_OPTIONS, useValue: { dateFormat: APP_DATE_FORMAT } }
  ]
};
