import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/401']);
  }

  const expectedRoles = route.data?.['expectedRoles'] as string[] | undefined;
  if (!expectedRoles?.length || expectedRoles.some((role) => authService.hasRole(role))) {
    return true;
  }

  return router.createUrlTree(['/403']);
};
