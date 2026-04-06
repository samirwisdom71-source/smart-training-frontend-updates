import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { appConfig } from '../../config/app.config';

/** Do not send Bearer on these routes: expired JWT would make JwtBearer reject the request before [AllowAnonymous] runs. */
function shouldSkipBearerToken(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes('/api/auth/login') ||
    lower.includes('/api/auth/refresh') ||
    lower.includes('/api/auth/forgot-password') ||
    lower.includes('/api/auth/reset-password')
  );
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getAccessToken();
  const apiUrl = appConfig.apiUrl;

  if (token && req.url.startsWith(apiUrl) && !shouldSkipBearerToken(req.url)) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && req.url.startsWith(apiUrl) && !req.url.includes('/login') && !req.url.includes('/refresh')) {
        const refreshToken = auth.getRefreshToken();
        if (refreshToken) {
          return auth.refreshToken(refreshToken).pipe(
            switchMap((res) => {
              const newReq = req.clone({
                setHeaders: { Authorization: `Bearer ${res.accessToken}` },
              });
              return next(newReq);
            }),
            catchError(() => {
              auth.logout();
              return throwError(() => err);
            })
          );
        }
      }
      return throwError(() => err);
    })
  );
};
