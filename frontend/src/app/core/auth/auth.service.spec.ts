import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService, { provide: Router, useValue: routerSpy }],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('hasPermission returns false when no user', () => {
    expect(service.hasPermission('any:permission')).toBe(false);
  });

  it('login then hasPermission/hasAnyPermission/hasAllPermissions', (done) => {
    service.login('u@test.com', 'pass').subscribe({
      next: () => {
        expect(service.hasPermission('report:view')).toBe(true);
        expect(service.hasPermission('other:view')).toBe(false);
        expect(service.hasAnyPermission(['report:view'])).toBe(true);
        expect(service.hasAnyPermission(['other'])).toBe(false);
        expect(service.hasAllPermissions(['report:view', 'dashboard:view'])).toBe(true);
        expect(service.hasAllPermissions(['report:view', 'missing'])).toBe(false);
        done();
      },
    });
    const req = httpMock.expectOne((r) => r.url.includes('/api/auth/login'));
    req.flush({
      success: true,
      data: {
        accessToken: 'at',
        refreshToken: 'rt',
        accessTokenExpiresAt: new Date(Date.now() + 3600000).toISOString(),
        userId: '1',
        email: 'u@test.com',
        fullName: 'User',
        profilePicturePath: null,
        roles: [],
        permissions: ['report:view', 'dashboard:view'],
      },
    });
  });

  it('hasAnyPermission returns true when permissions array is empty', () => {
    expect(service.hasAnyPermission([])).toBe(true);
  });

  it('hasAllPermissions returns true when permissions array is empty', () => {
    expect(service.hasAllPermissions([])).toBe(true);
  });

  it('getAccessToken returns null when not logged in', () => {
    expect(service.getAccessToken()).toBeNull();
  });

  it('logout clears state and navigates to login', (done) => {
    service.login('u@test.com', 'pass').subscribe({
      next: () => {
        service.logout();
        expect(service.getAccessToken()).toBeNull();
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
        done();
      },
    });
    const req = httpMock.expectOne((r) => r.url.includes('/api/auth/login'));
    req.flush({
      success: true,
      data: {
        accessToken: 'at',
        refreshToken: 'rt',
        accessTokenExpiresAt: new Date(Date.now() + 3600000).toISOString(),
        userId: '1',
        email: 'u@test.com',
        fullName: 'User',
        profilePicturePath: null,
        roles: [],
        permissions: [],
      },
    });
  });
});
