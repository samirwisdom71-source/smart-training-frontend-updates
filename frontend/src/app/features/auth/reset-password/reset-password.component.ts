import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, TranslateModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-page__bg" aria-hidden="true"></div>
      <div class="auth-page__card ds-card ds-card--elevated">
        <a routerLink="/home" class="auth-page__back">{{ 'landing.backToHome' | translate }}</a>
        <h1 class="auth-page__title">{{ 'auth.resetPasswordTitle' | translate }}</h1>
        <p class="auth-page__subtitle">{{ 'auth.resetPasswordSubtitle' | translate }}</p>
        @if (success) {
          <p class="auth-page__success">{{ 'auth.resetSuccess' | translate }}</p>
          <a routerLink="/login" class="ds-btn ds-btn--primary ds-btn--lg" style="width: 100%;">{{ 'auth.login' | translate }}</a>
        } @else {
          @if (errorMessage) {
            <p class="ds-field-error auth-page__error">{{ errorMessage }}</p>
          }
          <form class="auth-page__form" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label for="newPassword" class="ds-label">{{ 'auth.newPassword' | translate }}</label>
              <div class="input-wrap">
                <input
                  id="newPassword"
                  [type]="showPassword ? 'text' : 'password'"
                  class="ds-input"
                  [class.ds-input--error]="newPasswordError"
                  [placeholder]="'auth.newPasswordPlaceholder' | translate"
                  [(ngModel)]="newPassword"
                  name="newPassword"
                  autocomplete="new-password"
                />
                <button type="button" class="input-toggle" (click)="showPassword = !showPassword" [attr.aria-label]="showPassword ? 'Hide password' : 'Show password'">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
              </div>
              @if (newPasswordError) { <span class="ds-field-error">{{ newPasswordError }}</span> }
            </div>
            <div class="form-group">
              <label for="confirmPassword" class="ds-label">{{ 'auth.confirmPassword' | translate }}</label>
              <input
                id="confirmPassword"
                type="password"
                class="ds-input"
                [class.ds-input--error]="confirmError"
                [placeholder]="'auth.confirmPasswordPlaceholder' | translate"
                [(ngModel)]="confirmPassword"
                name="confirmPassword"
                autocomplete="new-password"
              />
              @if (confirmError) { <span class="ds-field-error">{{ confirmError }}</span> }
            </div>
            <button type="submit" class="ds-btn ds-btn--primary ds-btn--lg auth-page__submit" [disabled]="loading">
              {{ loading ? ('auth.resetting' | translate) : ('auth.setNewPassword' | translate) }}
            </button>
          </form>
          <p class="auth-page__footer">
            <a routerLink="/login" class="auth-page__link">{{ 'auth.login' | translate }}</a>
          </p>
        }
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: var(--space-xl); position: relative; }
    .auth-page__bg { position: absolute; inset: 0; background: linear-gradient(160deg, var(--color-bg) 0%, var(--color-bg-alt) 50%, rgba(10,77,82,0.05) 100%); }
    .auth-page__card { position: relative; width: 100%; max-width: 420px; }
    .auth-page__back { display: inline-block; margin-bottom: var(--space-lg); font-size: var(--text-body-sm); color: var(--color-text-secondary); text-decoration: none; }
    .auth-page__back:hover { color: var(--color-primary); }
    .auth-page__title { font-size: var(--text-display-2); font-weight: 600; margin: 0 0 var(--space-sm); color: var(--color-text); }
    .auth-page__subtitle { margin: 0 0 var(--space-lg); color: var(--color-text-secondary); font-size: var(--text-body-sm); }
    .auth-page__success { margin: 0 0 var(--space-lg); color: var(--color-success); font-size: var(--text-body-sm); }
    .auth-page__error { margin-bottom: var(--space-md); }
    .auth-page__form { display: flex; flex-direction: column; gap: var(--space-md); }
    .form-group { display: flex; flex-direction: column; }
    .input-wrap { position: relative; }
    .input-wrap .ds-input { padding-inline-end: 44px; }
    .input-toggle { position: absolute; inset-inline-end: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--color-text-muted); cursor: pointer; padding: 4px; }
    .input-toggle:hover { color: var(--color-text); }
    .auth-page__submit { margin-top: var(--space-sm); }
    .auth-page__submit:disabled { opacity: 0.6; cursor: not-allowed; }
    .auth-page__footer { margin-top: var(--space-lg); text-align: center; font-size: var(--text-body-sm); }
    .auth-page__link { color: var(--color-primary); text-decoration: none; }
    .auth-page__link:hover { text-decoration: underline; }
  `]
})
export class ResetPasswordComponent {
  token = '';
  newPassword = '';
  confirmPassword = '';
  showPassword = false;
  loading = false;
  success = false;
  errorMessage = '';
  newPasswordError = '';
  confirmError = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private translate: TranslateService
  ) {
    this.token = this.route.snapshot.paramMap.get('token') ?? '';
  }

  onSubmit(): void {
    this.newPasswordError = '';
    this.confirmError = '';
    this.errorMessage = '';
    if (!this.newPassword.trim()) {
      this.newPasswordError = this.translate.instant('validation.required');
      return;
    }
    if (this.newPassword.length < 8) {
      this.newPasswordError = this.translate.instant('validation.minLength', { min: 8 });
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.confirmError = this.translate.instant('auth.passwordMismatch');
      return;
    }
    this.loading = true;
    this.auth.resetPassword(this.token, this.newPassword).subscribe({
      next: () => { this.success = true; this.loading = false; },
      error: (err) => {
        this.loading = false;
        const body = err.error;
        this.errorMessage = body?.errors?.[0] ?? body?.message ?? err.message ?? this.translate.instant('auth.resetError');
      }
    });
  }
}
