import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [FormsModule, TranslateModule, RouterLink],
  template: `
    <div class="change-password-page">
      <a [routerLink]="['/profile']" class="change-password-page__back">{{ 'profile.backToProfile' | translate }}</a>
      <div class="change-password-page__card ds-card ds-card--elevated">
        <h1 class="change-password-page__title">{{ 'auth.changePasswordTitle' | translate }}</h1>
        <p class="change-password-page__subtitle">{{ 'auth.changePasswordSubtitle' | translate }}</p>
        @if (successMessage) {
          <p class="change-password-page__success">{{ successMessage }}</p>
          <a [routerLink]="['/profile']" class="ds-btn ds-btn--primary">{{ 'profile.backToProfile' | translate }}</a>
        } @else {
          @if (errorMessage) {
            <p class="ds-field-error change-password-page__error">{{ errorMessage }}</p>
          }
          <form class="change-password-form" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label for="currentPassword" class="ds-label">{{ 'auth.currentPassword' | translate }}</label>
              <div class="input-wrap">
                <input
                  id="currentPassword"
                  [type]="showCurrent ? 'text' : 'password'"
                  class="ds-input"
                  [class.ds-input--error]="currentError"
                  [placeholder]="'auth.currentPasswordPlaceholder' | translate"
                  [(ngModel)]="currentPassword"
                  name="currentPassword"
                  autocomplete="current-password"
                />
                <button type="button" class="input-toggle" (click)="showCurrent = !showCurrent" aria-label="Toggle visibility">...</button>
              </div>
              @if (currentError) { <span class="ds-field-error">{{ currentError }}</span> }
            </div>
            <div class="form-group">
              <label for="newPassword" class="ds-label">{{ 'auth.newPassword' | translate }}</label>
              <div class="input-wrap">
                <input
                  id="newPassword"
                  [type]="showNew ? 'text' : 'password'"
                  class="ds-input"
                  [class.ds-input--error]="newError"
                  [placeholder]="'auth.newPasswordPlaceholder' | translate"
                  [(ngModel)]="newPassword"
                  name="newPassword"
                  autocomplete="new-password"
                />
                <button type="button" class="input-toggle" (click)="showNew = !showNew" aria-label="Toggle visibility">...</button>
              </div>
              @if (newError) { <span class="ds-field-error">{{ newError }}</span> }
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
            <div class="form-actions">
              <button type="submit" class="ds-btn ds-btn--primary" [disabled]="loading">
                {{ loading ? ('common.loading' | translate) : ('auth.changePassword' | translate) }}
              </button>
              <a [routerLink]="['/profile']" class="ds-btn ds-btn--secondary">{{ 'common.cancel' | translate }}</a>
            </div>
          </form>
        }
      </div>
    </div>
  `,
  styles: [`
    .change-password-page { padding: var(--space-lg); max-width: 480px; margin: 0 auto; }
    .change-password-page__back { display: inline-block; margin-bottom: var(--space-lg); font-size: var(--text-body-sm); color: var(--color-text-secondary); text-decoration: none; }
    .change-password-page__back:hover { color: var(--color-primary); }
    .change-password-page__card { padding: var(--space-xl); }
    .change-password-page__title { font-size: var(--text-display-2); font-weight: 600; margin: 0 0 var(--space-sm); color: var(--color-text); }
    .change-password-page__subtitle { margin: 0 0 var(--space-lg); color: var(--color-text-secondary); font-size: var(--text-body-sm); }
    .change-password-page__success { color: var(--color-success); margin: 0 0 var(--space-md); }
    .change-password-page__error { margin-bottom: var(--space-md); }
    .change-password-form { display: flex; flex-direction: column; gap: var(--space-md); }
    .form-group { display: flex; flex-direction: column; }
    .input-wrap { position: relative; }
    .input-wrap .ds-input { padding-inline-end: 44px; }
    .input-toggle { position: absolute; inset-inline-end: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--color-text-muted); cursor: pointer; padding: 4px; font-size: var(--text-caption); }
    .form-actions { display: flex; gap: var(--space-md); margin-top: var(--space-md); }
  `]
})
export class ChangePasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  showCurrent = false;
  showNew = false;
  loading = false;
  successMessage = '';
  errorMessage = '';
  currentError = '';
  newError = '';
  confirmError = '';

  onSubmit(): void {
    this.currentError = '';
    this.newError = '';
    this.confirmError = '';
    this.errorMessage = '';
    if (!this.currentPassword.trim()) {
      this.currentError = this.translate.instant('validation.required');
      return;
    }
    if (!this.newPassword.trim()) {
      this.newError = this.translate.instant('validation.required');
      return;
    }
    if (this.newPassword.length < 8) {
      this.newError = this.translate.instant('validation.minLength', { min: 8 });
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.confirmError = this.translate.instant('auth.passwordMismatch');
      return;
    }
    this.loading = true;
    this.auth.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = this.translate.instant('auth.passwordUpdated');
      },
      error: (err) => {
        this.loading = false;
        const body = err.error;
        this.errorMessage = body?.errors?.[0] ?? body?.message ?? err.message ?? this.translate.instant('dialog.error');
      },
    });
  }
}
