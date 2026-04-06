import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { permissionGuard } from './permission.guard';
import { AuthService } from '../auth/auth.service';

describe('permissionGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authService = jasmine.createSpyObj('AuthService', ['hasAnyPermission']);
    router = jasmine.createSpyObj('Router', ['navigate']);
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('allows access when route has no permissions', (done) => {
    const route = { data: {} } as unknown as ActivatedRouteSnapshot;
    (TestBed.runInInjectionContext(() => permissionGuard(route, {} as any)) as any).subscribe((allowed: boolean) => {
      expect(allowed).toBe(true);
      expect(authService.hasAnyPermission).not.toHaveBeenCalled();
      done();
    });
  });

  it('allows access when user has any of the required permissions', (done) => {
    authService.hasAnyPermission.and.returnValue(true);
    const route = { data: { permissions: ['dashboard:view'] } } as unknown as ActivatedRouteSnapshot;
    (TestBed.runInInjectionContext(() => permissionGuard(route, {} as any)) as any).subscribe((allowed: boolean) => {
      expect(allowed).toBe(true);
      expect(authService.hasAnyPermission).toHaveBeenCalledWith(['dashboard:view']);
      expect(router.navigate).not.toHaveBeenCalled();
      done();
    });
  });

  it('redirects to dashboard when user lacks permissions', (done) => {
    authService.hasAnyPermission.and.returnValue(false);
    const route = { data: { permissions: ['admin:view'] } } as unknown as ActivatedRouteSnapshot;
    (TestBed.runInInjectionContext(() => permissionGuard(route, {} as any)) as any).subscribe((allowed: boolean) => {
      expect(allowed).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
      done();
    });
  });
});
