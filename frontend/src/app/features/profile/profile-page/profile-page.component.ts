import { Component, inject, OnInit, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/auth/auth.service';
import { appConfig } from '../../../config/app.config';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [RouterLink, TranslateModule],
  template: `
    <div class="profile-page">
      <section class="profile-card ds-card ds-card--elevated">
        <header class="profile-card__header">
          <div class="profile-card__title-block">
            <h1 class="profile-card__title">{{ 'profile.title' | translate }}</h1>
            <p class="profile-card__subtitle">{{ 'profile.personalInfo' | translate }}</p>
          </div>
          <div class="profile-card__actions">
            <a [routerLink]="['/profile/edit']" class="ds-btn ds-btn--secondary ds-btn--sm">
              {{ 'profile.editProfile' | translate }}
            </a>
            <a [routerLink]="['/profile/change-password']" class="ds-btn ds-btn--ghost ds-btn--sm">
              {{ 'profile.changePassword' | translate }}
            </a>
          </div>
        </header>

        <div class="profile-card__body">
          <div class="profile-card__main">
            <div class="profile-avatar-wrap">
              @if (user()?.profilePicturePath) {
                <img [src]="profileImageUrl()" alt="" class="profile-avatar" />
              } @else {
                <span class="profile-avatar profile-avatar--initials">{{ initials() }}</span>
              }
            </div>
            <div class="profile-main-info">
              <h2 class="profile-name">{{ user()?.fullName ?? '—' }}</h2>
              <p class="profile-email">{{ user()?.email ?? '—' }}</p>
              @if (user()?.roles?.length) {
                <div class="profile-roles">
                  @for (r of user()!.roles; track r) {
                    <span class="ds-badge ds-badge--neutral">{{ r }}</span>
                  }
                </div>
              }
            </div>
          </div>

          <div class="profile-card__details">
            <section class="profile-section">
              <h3 class="profile-section__title">{{ 'profile.personalInfo' | translate }}</h3>
              <dl class="profile-dl">
                <dt>{{ 'profile.fullName' | translate }}</dt>
                <dd>{{ user()?.fullName ?? '—' }}</dd>
                <dt>{{ 'profile.email' | translate }}</dt>
                <dd>{{ user()?.email ?? '—' }}</dd>
              </dl>
            </section>

            <section class="profile-section">
              <h3 class="profile-section__title">{{ 'profile.jobInfo' | translate }}</h3>
              <dl class="profile-dl">
                <dt>{{ 'profile.jobTitle' | translate }}</dt>
                <dd>{{ jobTitleDisplay() }}</dd>
                <dt>{{ 'profile.department' | translate }}</dt>
                <dd>{{ departmentDisplay() }}</dd>
              </dl>
            </section>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .profile-page {
      padding: var(--space-xl);
      max-width: var(--content-max-width);
      margin: 0 auto;
    }
    .profile-card {
      padding: var(--space-xl);
      display: flex;
      flex-direction: column;
      gap: var(--space-xl);
    }
    .profile-card__header {
      display: flex;
      justify-content: space-between;
      gap: var(--space-md);
      align-items: center;
      border-bottom: 1px solid var(--color-border-light);
      padding-bottom: var(--space-md);
    }
    .profile-card__title-block {
      display: flex;
      flex-direction: column;
      gap: var(--space-2xs);
    }
    .profile-card__title {
      font-size: var(--text-display-2);
      font-weight: 600;
      margin: 0;
      color: var(--color-text);
    }
    .profile-card__subtitle {
      margin: 0;
      font-size: var(--text-body-sm);
      color: var(--color-text-secondary);
    }
    .profile-card__actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-sm);
    }
    .profile-card__body {
      display: grid;
      grid-template-columns: minmax(0, 1.4fr) minmax(0, 1.2fr);
      gap: var(--space-xl);
      align-items: flex-start;
    }
    @media (max-width: 900px) {
      .profile-card__body {
        grid-template-columns: 1fr;
      }
    }
    .profile-card__main {
      display: flex;
      gap: var(--space-lg);
      align-items: center;
    }
    .profile-avatar-wrap {
      flex-shrink: 0;
    }
    .profile-avatar {
      width: 96px;
      height: 96px;
      border-radius: var(--radius-full);
      object-fit: cover;
      display: block;
    }
    .profile-avatar--initials {
      width: 96px;
      height: 96px;
      border-radius: var(--radius-full);
      background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
      color: var(--color-primary-contrast);
      font-size: 2rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }
    .profile-main-info {
      display: flex;
      flex-direction: column;
      gap: var(--space-2xs);
    }
    .profile-name {
      font-size: var(--text-h1);
      font-weight: 600;
      margin: 0;
      color: var(--color-text);
    }
    .profile-email {
      font-size: var(--text-body-sm);
      color: var(--color-text-secondary);
      margin: 0;
    }
    .profile-roles {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2xs);
      margin-top: var(--space-xs);
    }
    .profile-card__details {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--space-lg);
    }
    .profile-section__title {
      font-size: var(--text-h2);
      font-weight: 600;
      margin: 0 0 var(--space-md);
      color: var(--color-text);
    }
    .profile-dl { margin: 0; display: grid; grid-template-columns: auto 1fr; gap: var(--space-2xs) var(--space-lg); font-size: var(--text-body-sm); }
    .profile-dl dt { color: var(--color-text-muted); }
    .profile-dl dd { margin: 0; color: var(--color-text); }
  `]
})
export class ProfilePageComponent implements OnInit {
  private readonly auth = inject(AuthService);

  readonly user = this.auth.user;

  /** Support both camelCase (API) and PascalCase (legacy/other) */
  readonly jobTitleDisplay = computed(() => {
    const u = this.user();
    if (!u) return '—';
    const v = (u as { jobTitle?: string | null; JobTitle?: string | null }).jobTitle ?? (u as { jobTitle?: string | null; JobTitle?: string | null }).JobTitle;
    return (v != null && v !== '') ? v : '—';
  });
  readonly departmentDisplay = computed(() => {
    const u = this.user();
    if (!u) return '—';
    const v = (u as { department?: string | null; Department?: string | null }).department ?? (u as { department?: string | null; Department?: string | null }).Department;
    return (v != null && v !== '') ? v : '—';
  });

  ngOnInit(): void {
    this.auth.loadCurrentUser().subscribe();
  }

  initials(): string {
    const name = this.user()?.fullName?.trim() ?? '';
    const parts = name.split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase() || '—';
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

  constructor(private translate: TranslateService) {}
}
