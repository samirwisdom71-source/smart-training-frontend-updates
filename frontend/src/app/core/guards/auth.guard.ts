import { inject } from '@angular/core';
import { Router, CanActivateFn, UrlTree } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) return true;
  router.navigate(['/home']);
  return false;
};

/** Blocks login (and similar) when a session already exists in storage */
export const guestGuard: CanActivateFn = (): boolean | UrlTree | Observable<boolean | UrlTree> => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const decide = (): boolean | UrlTree => {
    if (auth.isAuthenticated()) {
      return router.createUrlTree(['/dashboard']);
    }
    return true;
  };

  if (auth.isInitialized()) {
    return decide();
  }

  return toObservable(auth.isInitialized).pipe(
    filter((v) => v),
    take(1),
    map(() => decide())
  );
};
