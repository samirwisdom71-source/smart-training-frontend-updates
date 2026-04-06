import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/auth/auth.service';
import { LocaleService } from '../../../core/i18n/locale.service';
import { LanguageSwitcherComponent } from '../../../layout/header/language-switcher/language-switcher.component';

const REMEMBER_EMAIL_KEY = 'smart_training_remember_email';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, TranslateModule, RouterLink, LanguageSwitcherComponent],
  template: `
    <div class="login-controls">
      <a routerLink="/home" class="login-header__back-icon" [attr.aria-label]="'landing.backToHome' | translate">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </a>
      <app-language-switcher />
    </div>
    <div class="login-page">
      <div class="login-page__bg" aria-hidden="true"></div>
      <div class="login-card ds-card ds-card--elevated" [attr.dir]="locale.isRtl ? 'rtl' : 'ltr'">
        <p class="login-subtitle">{{ 'auth.login' | translate }}</p>
        @if (errorMessage) {
          <p class="ds-field-error error-msg">{{ errorMessage }}</p>
        }
        <form class="login-form" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="email" class="ds-label">{{ 'auth.email' | translate }}</label>
            <input
              id="email"
              type="email"
              class="ds-input"
              [class.ds-input--error]="emailError"
              [placeholder]="'auth.emailPlaceholder' | translate"
              [(ngModel)]="email"
              name="email"
              autocomplete="email"
            />
            @if (emailError) { <span class="ds-field-error">{{ emailError }}</span> }
          </div>
          <div class="form-group">
            <label for="password" class="ds-label">{{ 'auth.password' | translate }}</label>
            <div class="input-wrap">
              <input
                id="password"
                [type]="showPassword ? 'text' : 'password'"
                class="ds-input"
                [class.ds-input--error]="passwordError"
                [placeholder]="'auth.passwordPlaceholder' | translate"
                [(ngModel)]="password"
                name="password"
                autocomplete="current-password"
              />
              <button
                type="button"
                class="input-toggle"
                (click)="showPassword = !showPassword"
                [attr.aria-label]="showPassword ? ('auth.hidePassword' | translate) : ('auth.showPassword' | translate)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
            @if (passwordError) { <span class="ds-field-error">{{ passwordError }}</span> }
            <a routerLink="/forgot-password" class="forgot-link">{{ 'auth.forgotPassword' | translate }}</a>
          </div>
          <label class="remember-wrap">
            <input type="checkbox" [(ngModel)]="rememberMe" name="rememberMe" class="remember-check" />
            <span>{{ 'auth.rememberMe' | translate }}</span>
          </label>
          <button type="submit" class="ds-btn ds-btn--primary ds-btn--lg login-btn" [disabled]="loading">
            {{ loading ? ('auth.signingIn' | translate) : ('auth.login' | translate) }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: calc(var(--space-xl) + 40px) var(--space-2xl) var(--space-xl);
      position: relative;
      direction: ltr;
    }
    .login-page__bg {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(160deg, rgba(15,23,42,0.22), rgba(15,23,42,0.4)),
        url('/assets/images/login-bg.jpg');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    }
    .login-header {
      display: none;
    }
    .login-controls {
      position: fixed;
      top: var(--space-sm);
      inset-inline-start: var(--space-lg);
      z-index: 10;
      display: flex;
      align-items: center;
      gap: var(--space-sm);
    }
    .login-header__back-icon {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-full);
      border: 1px solid var(--color-border-light);
      background: var(--color-bg-elevated);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--color-text);
      text-decoration: none;
    }
    .login-header__back-icon svg {
      width: 20px;
      height: 20px;
    }
    .login-header__back-icon:hover {
      background: var(--color-bg-hover);
      border-color: var(--color-border);
    }
    .login-header__brand {
      display: flex;
      align-items: center;
      gap: var(--space-md);
    }
    .login-header__logo {
      width: 32px;
      height: 32px;
      object-fit: contain;
    }
    .login-header__right {
      display: flex;
      align-items: center;
      gap: var(--space-md);
    }
    .login-header__app-name {
      font-family: var(--font-display);
      font-weight: 600;
      font-size: var(--text-h1);
      color: var(--color-text);
    }
    .login-card {
      position: relative;
      width: 100%;
      max-width: 440px;
      min-height: 420px;
      z-index: 1;
    }
    .login-brand { display: flex; align-items: center; gap: var(--space-sm); margin-bottom: var(--space-sm); }
    .login-brand__mark {
      width: 40px; height: 40px; border-radius: var(--radius-sm);
      background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
    }
    .login-title {
      font-size: var(--text-display-2);
      font-weight: 600;
      margin: 0;
      color: var(--color-text);
      letter-spacing: -0.02em;
      font-family: var(--font-display);
    }
    .login-subtitle {
      margin: 0 0 var(--space-lg);
      color: var(--color-text-secondary);
      font-size: var(--text-body-sm);
      text-align: center;
    }
    .error-msg { margin-bottom: var(--space-md); }
    .login-form { display: flex; flex-direction: column; gap: var(--space-md); }
    .form-group { display: flex; flex-direction: column; }
    .input-wrap { position: relative; }
    .input-wrap .ds-input { padding-inline-end: 44px; }
    .input-toggle {
      position: absolute; inset-inline-end: 10px; top: 50%; transform: translateY(-50%);
      background: none; border: none; color: var(--color-text-muted); cursor: pointer; padding: 4px;
    }
    .input-toggle:hover { color: var(--color-text); }
    .forgot-link { font-size: var(--text-caption); margin-top: var(--space-2xs); color: var(--color-primary); text-decoration: none; }
    .forgot-link:hover { text-decoration: underline; }
    .remember-wrap { display: flex; align-items: center; gap: var(--space-sm); font-size: var(--text-body-sm); color: var(--color-text-secondary); cursor: pointer; }
    .remember-check { width: 18px; height: 18px; accent-color: var(--color-primary); }
    .login-btn {
      margin-top: var(--space-sm);
      background-color: color-mix(in srgb, var(--color-primary) 80%, #ffffff 20%);
      border-color: color-mix(in srgb, var(--color-primary) 80%, #ffffff 20%);
    }
    .login-btn:hover:not(:disabled) {
      background-color: color-mix(in srgb, var(--color-primary) 70%, #ffffff 30%);
      border-color: color-mix(in srgb, var(--color-primary) 70%, #ffffff 30%);
    }
    .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .login-note { margin: var(--space-lg) 0 0; font-size: var(--text-caption); color: var(--color-text-muted); }
  `]
})
export class LoginComponent {
  readonly locale = inject(LocaleService);
  email = '';
  password = '';
  showPassword = false;
  rememberMe = false;
  loading = false;
  errorMessage = '';
  emailError = '';
  passwordError = '';

  constructor(
    private router: Router,
    private auth: AuthService,
    private translate: TranslateService
  ) {
    try {
      const saved = localStorage.getItem(REMEMBER_EMAIL_KEY);
      if (saved) { this.email = saved; this.rememberMe = true; }
    } catch { /* ignore */ }
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.emailError = '';
    this.passwordError = '';
    const e = this.email.trim();
    const p = this.password;
    if (!e) {
      this.emailError = this.translate.instant('validation.required');
      return;
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(e)) {
      this.emailError = this.translate.instant('validation.email');
      return;
    }
    if (!p) {
      this.passwordError = this.translate.instant('validation.required');
      return;
    }
    this.loading = true;
    this.auth.login(e, p).subscribe({
      next: () => {
        if (this.rememberMe) localStorage.setItem(REMEMBER_EMAIL_KEY, e);
        else localStorage.removeItem(REMEMBER_EMAIL_KEY);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.errors?.[0] ?? err.message ?? this.translate.instant('auth.loginError');
      },
      complete: () => { this.loading = false; }
    });
  }
}
