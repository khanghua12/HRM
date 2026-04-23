import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, type MenuKey } from '../services/auth.service';

export const menuPermissionGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const menu = route.data?.['menu'] as MenuKey | undefined;
  if (!menu) return true;

  if (auth.canAccessMenu(menu)) {
    return true;
  }

  const firstAllowed = auth.menuPermissions()[0] ?? 'employees';
  return router.parseUrl(`/${firstAllowed}`);
};
