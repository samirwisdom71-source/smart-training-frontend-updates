import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { TooltipDirective } from '../../../shared/tooltip/tooltip.directive';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [FormsModule, TranslateModule, RouterLink, PageShellComponent, TooltipDirective],
  template: `
    <app-page-shell
      [title]="'auth.changePasswordTitle' | translate"
      [breadcrumbs]="breadcrumbs()"
      [fullWidth]="true"
      [showPageTitle]="false"
    >
      <div class="ent-admin-page ent-page-fade-in">
        <header class="ent-admin-hero">
          <div class="ent-admin-hero__inner">
            <h1 class="ent-admin-hero__title">{{ 'auth.changePasswordTitle' | translate }}</h1>
            <p class="ent-admin-hero__subtitle">{{ 'enterprise.adminHeroSubtitle' | translate }}</p>
          </div>
        </header>

        <div class="ent-admin-content">
          <div class="ent-table-panel profile-subpage-panel">
            <a [routerLink]="['/profile']" class="profile-subpage-back">{{ 'profile.backToProfile' | translate }}</a>

            @if (successMessage) {
              <p class="profile-subpage-success">{{ successMessage }}</p>
              <a [routerLink]="['/profile']" class="ds-btn ds-btn--primary premium-primary-btn">{{ 'profile.backToProfile' | translate }}</a>
            } @else {
              @if (errorMessage) {
                <div class="premium-modal__error profile-subpage-alert">
                  <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M12 9v4"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                    />
                    <path
                      d="M12 17h.01"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="3"
                      stroke-linecap="round"
                    />
                    <path
                      d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.6"
                      stroke-linejoin="round"
                    />
                  </svg>
                  <p class="premium-modal__error-text">{{ errorMessage }}</p>
                </div>
              }
              <form class="profile-subpage-form" (ngSubmit)="onSubmit()">
                <div class="form-group">
                  <label for="currentPassword" class="ds-label">{{ 'auth.currentPassword' | translate }}</label>
                  <div class="password-field-wrap">
                    <input
                      id="currentPassword"
                      [type]="showCurrent ? 'text' : 'password'"
                      class="ds-input password-field-wrap__input"
                      [class.ds-input--error]="currentError"
                      [placeholder]="'auth.currentPasswordPlaceholder' | translate"
                      [(ngModel)]="currentPassword"
                      name="currentPassword"
                      autocomplete="current-password"
                    />
                    <button
                      type="button"
                      class="ds-btn ds-btn--ghost ds-btn--icon password-field-wrap__toggle"
                      (click)="showCurrent = !showCurrent"
                      [attr.aria-label]="(showCurrent ? 'auth.hidePassword' : 'auth.showPassword') | translate"
                      [appTooltip]="(showCurrent ? 'auth.hidePassword' : 'auth.showPassword') | translate"
                    >
                      @if (showCurrent) {
                        <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                          <path
                            d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                          <line x1="1" y1="1" x2="23" y2="23" stroke-linecap="round" />
                        </svg>
                      } @else {
                        <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke-linecap="round" stroke-linejoin="round" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      }
                    </button>
                  </div>
                  @if (currentError) {
                    <span class="ds-field-error">{{ currentError }}</span>
                  }
                </div>
                <div class="form-group">
                  <label for="newPassword" class="ds-label">{{ 'auth.newPassword' | translate }}</label>
                  <div class="password-field-wrap">
                    <input
                      id="newPassword"
                      [type]="showNew ? 'text' : 'password'"
                      class="ds-input password-field-wrap__input"
                      [class.ds-input--error]="newError"
                      [placeholder]="'auth.newPasswordPlaceholder' | translate"
                      [(ngModel)]="newPassword"
                      name="newPassword"
                      autocomplete="new-password"
                    />
                    <button
                      type="button"
                      class="ds-btn ds-btn--ghost ds-btn--icon password-field-wrap__toggle"
                      (click)="showNew = !showNew"
                      [attr.aria-label]="(showNew ? 'auth.hidePassword' : 'auth.showPassword') | translate"
                      [appTooltip]="(showNew ? 'auth.hidePassword' : 'auth.showPassword') | translate"
                    >
                      @if (showNew) {
                        <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                          <path
                            d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                          <line x1="1" y1="1" x2="23" y2="23" stroke-linecap="round" />
                        </svg>
                      } @else {
                        <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke-linecap="round" stroke-linejoin="round" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      }
                    </button>
                  </div>
                  @if (newError) {
                    <span class="ds-field-error">{{ newError }}</span>
                  }
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
                  @if (confirmError) {
                    <span class="ds-field-error">{{ confirmError }}</span>
                  }
                </div>
                <div class="profile-subpage-actions">
                  <button type="submit" class="ds-btn ds-btn--primary premium-primary-btn" [disabled]="loading">
                    {{ loading ? ('common.loading' | translate) : ('auth.changePassword' | translate) }}
                  </button>
                  <a [routerLink]="['/profile']" class="ds-btn ds-btn--secondary premium-secondary-btn">{{ 'common.cancel' | translate }}</a>
                </div>
              </form>
            }
          </div>
        </div>
      </div>
    </app-page-shell>
  `,
  styles: [
    `
      .profile-subpage-panel {
        max-width: 1060px;
        padding: var(--space-lg);
      }

      .profile-subpage-back {
        display: inline-block;
        margin-bottom: var(--space-md);
        font-size: var(--text-body-sm);
        color: var(--color-text-secondary);
        text-decoration: none;
      }

      .profile-subpage-back:hover {
        color: var(--gulf-green-800);
      }

      .profile-subpage-success {
        color: var(--color-success);
        margin: 0 0 var(--space-md);
        font-size: var(--text-body-sm);
      }

      .profile-subpage-alert {
        margin-bottom: var(--space-md);
      }

      .profile-subpage-form {
        display: flex;
        flex-direction: column;
        gap: var(--space-md);
      }

      .form-group {
        display: flex;
        flex-direction: column;
      }

      .profile-subpage-actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-md);
        margin-top: var(--space-md);
      }

      .password-field-wrap__toggle .icon-svg {
        width: 20px;
        height: 20px;
      }
    `,
  ],
})
export class ChangePasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly translate = inject(TranslateService);

  readonly breadcrumbs = computed(() => [
    { label: this.translate.instant('nav.profile'), route: '/profile' },
    { label: this.translate.instant('profile.changePassword') },
  ]);

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
