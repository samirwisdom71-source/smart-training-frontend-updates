import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { map } from 'rxjs/operators';
import { of } from 'rxjs';

/**
 * Route data: permissions: string[] (any of these grants access).
 * Example: data: { permissions: ['dashboard:view'] } or data: { permissions: ['employee:view', 'employee:create'] }
 */
export const permissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const permissions = (route.data['permissions'] as string[]) ?? [];
  if (permissions.length === 0) return of(true);
  if (auth.hasAnyPermission(permissions)) return of(true);
  router.navigate(['/dashboard']);
  return of(false);
};
