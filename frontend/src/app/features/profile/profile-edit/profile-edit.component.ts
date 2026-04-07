import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { AuthService } from '../../../core/auth/auth.service';
import { appConfig } from '../../../config/app.config';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [FormsModule, TranslateModule, RouterLink, PageShellComponent],
  template: `
    <app-page-shell
      [title]="'profile.editProfile' | translate"
      [breadcrumbs]="breadcrumbs()"
      [fullWidth]="true"
      [showPageTitle]="false"
    >
      <div class="ent-admin-page ent-page-fade-in">
        <header class="ent-admin-hero">
          <div class="ent-admin-hero__inner">
            <h1 class="ent-admin-hero__title">{{ 'profile.editProfile' | translate }}</h1>
            <p class="ent-admin-hero__subtitle">{{ 'enterprise.adminHeroSubtitle' | translate }}</p>
          </div>
        </header>

        <div class="ent-admin-content">
          <div class="ent-table-panel profile-subpage-panel">
            <a [routerLink]="['/profile']" class="profile-subpage-back">{{ 'profile.backToProfile' | translate }}</a>

            @if (successMessage) {
              <p class="profile-subpage-success">{{ successMessage }}</p>
            }
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

            <form class="profile-subpage-form premium-form" (ngSubmit)="onSubmit()">
              <div class="form-group profile-photo-group">
                <label class="ds-label">{{ 'profile.profilePhoto' | translate }}</label>
                @if (user()?.profilePicturePath) {
                  <div class="profile-photo-preview">
                    <img [src]="profileImageUrl()" alt="" class="profile-photo-preview__img" />
                    <button type="button" class="ds-btn ds-btn--ghost ds-btn--sm" (click)="removePhoto()" [disabled]="photoLoading">
                      {{ 'profile.removePhoto' | translate }}
                    </button>
                  </div>
                } @else {
                  <div class="profile-photo-upload">
                    <input
                      type="file"
                      #photoInput
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      (change)="onPhotoSelected($event)"
                      class="profile-photo-upload__input"
                      [attr.aria-label]="'profile.choosePhoto' | translate"
                    />
                    <button
                      type="button"
                      class="ds-btn ds-btn--secondary ds-btn--sm premium-secondary-btn"
                      (click)="photoInput.click()"
                      [disabled]="photoLoading"
                    >
                      {{ photoLoading ? ('common.loading' | translate) : ('profile.choosePhoto' | translate) }}
                    </button>
                    <span class="profile-photo-upload__hint">{{ 'profile.photoHint' | translate }}</span>
                  </div>
                }
                @if (photoError) {
                  <span class="ds-field-error">{{ photoError }}</span>
                }
              </div>
              <div class="form-group">
                <label for="fullName" class="ds-label">{{ 'profile.fullName' | translate }}</label>
                <input
                  id="fullName"
                  type="text"
                  class="ds-input"
                  [class.ds-input--error]="fullNameError"
                  [placeholder]="'profile.fullName' | translate"
                  [(ngModel)]="fullName"
                  name="fullName"
                  autocomplete="name"
                />
                @if (fullNameError) {
                  <span class="ds-field-error">{{ fullNameError }}</span>
                }
              </div>
              <div class="form-group">
                <label class="ds-label">{{ 'profile.email' | translate }}</label>
                <p class="profile-subpage-readonly">{{ user()?.email ?? '—' }}</p>
                <span class="profile-subpage-hint">{{ 'profile.emailReadonlyHint' | translate }}</span>
              </div>
              <div class="profile-subpage-actions">
                <button type="submit" class="ds-btn ds-btn--primary premium-primary-btn" [disabled]="loading">
                  {{ loading ? ('common.loading' | translate) : ('profile.saveChanges' | translate) }}
                </button>
                <a [routerLink]="['/profile']" class="ds-btn ds-btn--secondary premium-secondary-btn">{{ 'common.cancel' | translate }}</a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </app-page-shell>
  `,
  styles: [
    `
      .profile-subpage-panel {
        max-width: 860px;
        margin-inline: auto;
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
        font-size: var(--text-body-sm);
        margin: 0 0 var(--space-md);
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

      .profile-subpage-readonly {
        margin: 0;
        padding: var(--space-sm) var(--space-md);
        background: color-mix(in srgb, var(--color-bg-subtle) 92%, var(--gulf-green-800) 4%);
        border: 1px solid color-mix(in srgb, var(--gulf-gold) 14%, var(--color-border));
        border-radius: var(--ent-radius-md, var(--radius-md));
        font-size: var(--text-body);
        color: var(--color-text-secondary);
      }

      .profile-subpage-hint {
        font-size: var(--text-caption);
        color: var(--color-text-muted);
        margin-top: var(--space-2xs);
      }

      .profile-subpage-actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-md);
        margin-top: var(--space-md);
      }

      .profile-photo-group {
        margin-bottom: var(--space-2xs);
      }

      .profile-photo-preview {
        display: flex;
        align-items: center;
        gap: var(--space-md);
      }

      .profile-photo-preview__img {
        width: 80px;
        height: 80px;
        border-radius: var(--radius-full);
        object-fit: cover;
        border: 2px solid color-mix(in srgb, var(--gulf-gold) 28%, var(--color-border));
      }

      .profile-photo-upload {
        display: flex;
        flex-direction: column;
        gap: var(--space-2xs);
      }

      .profile-photo-upload__input {
        position: absolute;
        width: 0;
        height: 0;
        opacity: 0;
      }

      .profile-photo-upload__hint {
        font-size: var(--text-caption);
        color: var(--color-text-muted);
      }
    `,
  ],
})
export class ProfileEditComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  readonly user = this.auth.user;

  readonly breadcrumbs = computed(() => [
    { label: this.translate.instant('nav.profile'), route: '/profile' },
    { label: this.translate.instant('profile.editProfile') },
  ]);

  fullName = '';
  loading = false;
  successMessage = '';
  errorMessage = '';
  fullNameError = '';
  photoLoading = false;
  photoError = '';

  constructor() {
    const u = this.auth.user();
    this.fullName = u?.fullName ?? '';
  }

  onSubmit(): void {
    this.fullNameError = '';
    this.errorMessage = '';
    this.successMessage = '';
    const name = this.fullName.trim();
    if (!name) {
      this.fullNameError = this.translate.instant('validation.required');
      return;
    }
    this.loading = true;
    this.auth.updateProfile({ fullName: name }).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = this.translate.instant('dialog.success');
        setTimeout(() => this.router.navigate(['/profile']), 1200);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message ?? err.message ?? this.translate.instant('dialog.error');
      },
    });
  }

  profileImageUrl(): string {
    const path = this.user()?.profilePicturePath;
    if (!path) return '';
    if (path.startsWith('http')) return path;
    if (path.startsWith('/')) return `${appConfig.apiUrl}${path}`;
    const normalized = path.replace(/\\/g, '/');
    const parts = normalized.split('/');
    const fileName = parts[parts.length - 1];
    return `${appConfig.apiUrl}/files/profile-photos/${fileName}`;
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    this.photoError = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      this.photoError = this.translate.instant('profile.photoTooLarge');
      return;
    }
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      this.photoError = this.translate.instant('profile.photoTypeInvalid');
      return;
    }
    this.photoLoading = true;
    this.auth.uploadProfilePhoto(file).subscribe({
      next: () => {
        this.photoLoading = false;
        this.successMessage = this.translate.instant('profile.photoUpdated');
      },
      error: (err) => {
        this.photoLoading = false;
        this.photoError = err.error?.message ?? err.message ?? this.translate.instant('dialog.error');
      },
    });
  }

  removePhoto(): void {
    this.photoError = '';
    this.photoLoading = true;
    this.auth.removeProfilePhoto().subscribe({
      next: () => {
        this.photoLoading = false;
        this.successMessage = this.translate.instant('profile.photoRemoved');
      },
      error: (err) => {
        this.photoLoading = false;
        this.photoError = err.error?.message ?? err.message ?? this.translate.instant('dialog.error');
      },
    });
  }
}
