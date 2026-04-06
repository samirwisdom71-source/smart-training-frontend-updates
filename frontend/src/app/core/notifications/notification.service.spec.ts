import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NotificationService } from './notification.service';
import { AuthService } from '../auth/auth.service';
import { signal } from '@angular/core';

describe('NotificationService', () => {
  let service: NotificationService;
  let httpMock: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    const userSignal = signal<{ permissions?: string[] } | null>(null);
    authService = jasmine.createSpyObj('AuthService', ['getAccessToken', 'hasPermission'], {
      user: userSignal.asReadonly(),
    });
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [NotificationService, { provide: AuthService, useValue: authService }],
    });
    service = TestBed.inject(NotificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('loadUnreadCount does not call API when no access token', () => {
    authService.getAccessToken.and.returnValue(null);
    service.loadUnreadCount();
    expect(authService.getAccessToken).toHaveBeenCalledTimes(1);
    httpMock.expectNone(() => true);
  });

  it('canView is false when user has no notification:view permission', () => {
    authService.hasPermission.and.returnValue(false);
    expect(service.canView()).toBe(false);
  });
});
