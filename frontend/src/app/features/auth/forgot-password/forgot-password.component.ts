import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, TranslateModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-page__bg" aria-hidden="true"></div>
      <div class="auth-page__card ds-card ds-card--elevated">
        <a routerLink="/home" class="auth-page__back">{{ 'landing.backToHome' | translate }}</a>
        <h1 class="auth-page__title">{{ 'auth.forgotPasswordTitle' | translate }}</h1>
        <p class="auth-page__subtitle">{{ 'auth.forgotPasswordSubtitle' | translate }}</p>
        @if (success) {
          <p class="auth-page__success">{{ 'auth.forgotSuccess' | translate }}</p>
          <a routerLink="/login" class="ds-btn ds-btn--primary ds-btn--lg" style="width: 100%;">{{ 'auth.login' | translate }}</a>
        } @else {
          @if (errorMessage) {
            <p class="ds-field-error auth-page__error">{{ errorMessage }}</p>
          }
          <form class="auth-page__form" (ngSubmit)="onSubmit()">
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
              @if (emailError) {
                <span class="ds-field-error">{{ emailError }}</span>
              }
            </div>
            <button type="submit" class="ds-btn ds-btn--primary ds-btn--lg auth-page__submit" [disabled]="loading">
              {{ loading ? ('auth.sending' | translate) : ('auth.sendResetLink' | translate) }}
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
    .auth-page {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      padding: var(--space-xl); position: relative;
    }
    .auth-page__bg {
      position: absolute; inset: 0;
      background: linear-gradient(160deg, var(--color-bg) 0%, var(--color-bg-alt) 50%, rgba(10,77,82,0.05) 100%);
    }
    .auth-page__card { position: relative; width: 100%; max-width: 420px; }
    .auth-page__back {
      display: inline-block; margin-bottom: var(--space-lg); font-size: var(--text-body-sm);
      color: var(--color-text-secondary); text-decoration: none;
    }
    .auth-page__back:hover { color: var(--color-primary); }
    .auth-page__title {
      font-size: var(--text-display-2); font-weight: 600; margin: 0 0 var(--space-sm);
      color: var(--color-text);
    }
    .auth-page__subtitle { margin: 0 0 var(--space-lg); color: var(--color-text-secondary); font-size: var(--text-body-sm); }
    .auth-page__success { margin: 0 0 var(--space-lg); color: var(--color-success); font-size: var(--text-body-sm); }
    .auth-page__error { margin-bottom: var(--space-md); }
    .auth-page__form { display: flex; flex-direction: column; gap: var(--space-md); }
    .form-group { display: flex; flex-direction: column; }
    .auth-page__submit { margin-top: var(--space-sm); }
    .auth-page__submit:disabled { opacity: 0.6; cursor: not-allowed; }
    .auth-page__footer { margin-top: var(--space-lg); text-align: center; font-size: var(--text-body-sm); }
    .auth-page__link { color: var(--color-primary); text-decoration: none; }
    .auth-page__link:hover { text-decoration: underline; }
  `]
})
export class ForgotPasswordComponent {
  email = '';
  loading = false;
  success = false;
  errorMessage = '';
  emailError = '';

  constructor(
    private auth: AuthService,
    private translate: TranslateService
  ) {}

  onSubmit(): void {
    this.emailError = '';
    this.errorMessage = '';
    const e = this.email.trim();
    if (!e) {
      this.emailError = this.translate.instant('validation.required');
      return;
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(e)) {
      this.emailError = this.translate.instant('validation.email');
      return;
    }
    this.loading = true;
    this.auth.forgotPassword(e).subscribe({
      next: () => { this.success = true; this.loading = false; },
      error: (err) => {
        this.loading = false;
        const body = err.error;
        this.errorMessage = body?.errors?.[0] ?? body?.message ?? err.message ?? this.translate.instant('auth.forgotError');
      }
    });
  }
}
