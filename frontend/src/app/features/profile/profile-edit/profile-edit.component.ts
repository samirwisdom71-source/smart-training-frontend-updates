import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/auth/auth.service';
import { appConfig } from '../../../config/app.config';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [FormsModule, TranslateModule, RouterLink],
  template: `
    <div class="profile-edit-page">
      <a [routerLink]="['/profile']" class="profile-edit-page__back">{{ 'profile.backToProfile' | translate }}</a>
      <div class="profile-edit-page__card ds-card ds-card--elevated">
        <h1 class="profile-edit-page__title">{{ 'profile.editProfile' | translate }}</h1>
        @if (successMessage) {
          <p class="profile-edit-page__success">{{ successMessage }}</p>
        }
        @if (errorMessage) {
          <p class="ds-field-error profile-edit-page__error">{{ errorMessage }}</p>
        }
        <form class="profile-edit-form" (ngSubmit)="onSubmit()">
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
                <button type="button" class="ds-btn ds-btn--secondary ds-btn--sm" (click)="photoInput.click()" [disabled]="photoLoading">
                  {{ photoLoading ? ('common.loading' | translate) : ('profile.choosePhoto' | translate) }}
                </button>
                <span class="profile-photo-upload__hint">{{ 'profile.photoHint' | translate }}</span>
              </div>
            }
            @if (photoError) { <span class="ds-field-error">{{ photoError }}</span> }
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
            @if (fullNameError) { <span class="ds-field-error">{{ fullNameError }}</span> }
          </div>
          <div class="form-group">
            <label class="ds-label">{{ 'profile.email' | translate }}</label>
            <p class="profile-edit-page__readonly">{{ user()?.email ?? '—' }}</p>
            <span class="profile-edit-page__hint">Email cannot be changed here.</span>
          </div>
          <div class="form-actions">
            <button type="submit" class="ds-btn ds-btn--primary" [disabled]="loading">
              {{ loading ? ('common.loading' | translate) : ('profile.saveChanges' | translate) }}
            </button>
            <a [routerLink]="['/profile']" class="ds-btn ds-btn--secondary">{{ 'common.cancel' | translate }}</a>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .profile-edit-page { padding: var(--space-lg); max-width: 560px; margin: 0 auto; }
    .profile-edit-page__back { display: inline-block; margin-bottom: var(--space-lg); font-size: var(--text-body-sm); color: var(--color-text-secondary); text-decoration: none; }
    .profile-edit-page__back:hover { color: var(--color-primary); }
    .profile-edit-page__card { padding: var(--space-xl); }
    .profile-edit-page__title { font-size: var(--text-display-2); font-weight: 600; margin: 0 0 var(--space-lg); color: var(--color-text); }
    .profile-edit-page__success { color: var(--color-success); font-size: var(--text-body-sm); margin: 0 0 var(--space-md); }
    .profile-edit-page__error { margin-bottom: var(--space-md); }
    .profile-edit-form { display: flex; flex-direction: column; gap: var(--space-md); }
    .form-group { display: flex; flex-direction: column; }
    .profile-edit-page__readonly { margin: 0; padding: var(--space-sm) var(--space-md); background: var(--color-bg-subtle); border-radius: var(--radius-sm); font-size: var(--text-body); color: var(--color-text-secondary); }
    .profile-edit-page__hint { font-size: var(--text-caption); color: var(--color-text-muted); margin-top: var(--space-2xs); }
    .form-actions { display: flex; gap: var(--space-md); margin-top: var(--space-md); }
    .profile-photo-group { margin-bottom: var(--space-md); }
    .profile-photo-preview { display: flex; align-items: center; gap: var(--space-md); }
    .profile-photo-preview__img { width: 80px; height: 80px; border-radius: var(--radius-full); object-fit: cover; }
    .profile-photo-upload { display: flex; flex-direction: column; gap: var(--space-2xs); }
    .profile-photo-upload__input { position: absolute; width: 0; height: 0; opacity: 0; }
    .profile-photo-upload__hint { font-size: var(--text-caption); color: var(--color-text-muted); }
  `]
})
export class ProfileEditComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  readonly user = this.auth.user;
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
