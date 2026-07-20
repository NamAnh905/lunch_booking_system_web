import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ROLES } from '@shared/constants/role.constants';
import { AuthService } from '../auth/auth.service';

export const superAdminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.hasRole(ROLES.SUPER_ADMIN)) {
    return true;
  }

  return router.createUrlTree(['/401']);
};
