import { Component, inject, OnInit, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { TooltipDirective } from '../../../shared/tooltip/tooltip.directive';
import { AuthService } from '../../../core/auth/auth.service';
import { appConfig } from '../../../config/app.config';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [RouterLink, TranslateModule, PageShellComponent, TooltipDirective],
  template: `
    <app-page-shell
      [title]="'nav.profile' | translate"
      [breadcrumbs]="breadcrumbs()"
      [fullWidth]="true"
      [showPageTitle]="false"
    >
      <div class="ent-admin-page ent-page-fade-in">
        <header class="ent-admin-hero">
          <div class="ent-admin-hero__inner">
            <h1 class="ent-admin-hero__title">{{ 'nav.profile' | translate }}</h1>
            <p class="ent-admin-hero__subtitle">{{ 'enterprise.adminHeroSubtitle' | translate }}</p>
          </div>
        </header>

        <div class="ent-admin-content">
          <div class="ent-table-panel profile-view-panel">
            <div class="profile-panel-toolbar">
              <div class="profile-panel-toolbar__actions">
                <a
                  [routerLink]="['/profile/edit']"
                  class="ds-btn ds-btn--primary premium-primary-btn profile-action-btn profile-action-btn--primary"
                  [attr.aria-label]="'profile.editProfile' | translate"
                  [appTooltip]="'profile.editProfile' | translate"
                >
                  <svg class="icon-svg profile-action-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M12 20h9" stroke-linecap="round" />
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" stroke-linejoin="round" />
                  </svg>
                  <span>{{ 'profile.editProfile' | translate }}</span>
                </a>
                <a
                  [routerLink]="['/profile/change-password']"
                  class="ds-btn ds-btn--secondary premium-secondary-btn profile-action-btn profile-action-btn--secondary"
                  [attr.aria-label]="'profile.changePassword' | translate"
                  [appTooltip]="'profile.changePassword' | translate"
                >
                  <svg class="icon-svg profile-action-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <rect x="5" y="11" width="14" height="10" rx="2" ry="2" stroke-linejoin="round" />
                    <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  <span>{{ 'profile.changePassword' | translate }}</span>
                </a>
              </div>
            </div>

            <div class="profile-panel-body">
              <div class="profile-panel-hero">
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
                        <span class="profile-role-badge">{{ r }}</span>
                      }
                    </div>
                  }
                </div>
              </div>

              <div class="profile-panel-details">
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
          </div>
        </div>
      </div>
    </app-page-shell>
  `,
  styles: [
    `
      .profile-view-panel {
        padding: var(--space-lg);
      }

      .profile-panel-toolbar {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: var(--space-md);
        padding-bottom: var(--space-md);
        margin-bottom: var(--space-md);
        border-bottom: 1px solid color-mix(in srgb, var(--gulf-gold) 12%, var(--color-border));
      }

      .profile-panel-toolbar__actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-sm);
        justify-content: flex-end;
        align-items: center;
      }

      .profile-action-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-sm);
        min-height: 44px;
        padding-inline: var(--space-md);
        font-weight: 600;
        letter-spacing: 0.01em;
        text-decoration: none;
        transition:
          transform 0.18s ease,
          box-shadow 0.2s ease,
          border-color 0.2s ease;
      }

      .profile-action-btn:focus-visible {
        outline: 2px solid color-mix(in srgb, var(--gulf-gold) 55%, var(--gulf-green-800));
        outline-offset: 2px;
      }

      .profile-action-btn--primary:hover:not(:disabled) {
        transform: translateY(-1px);
      }

      .profile-action-btn--secondary {
        border-width: 1.5px;
      }

      .profile-action-btn--secondary:hover:not(:disabled) {
        transform: translateY(-1px);
      }

      .profile-action-btn__icon {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
        opacity: 0.95;
      }

      .profile-panel-body {
        display: grid;
        grid-template-columns: minmax(0, 1.4fr) minmax(0, 1.2fr);
        gap: var(--space-xl);
        align-items: flex-start;
      }

      @media (max-width: 900px) {
        .profile-panel-body {
          grid-template-columns: 1fr;
        }
      }

      .profile-panel-hero {
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
        border: 2px solid color-mix(in srgb, var(--gulf-gold) 35%, var(--color-border));
        box-shadow: 0 12px 28px rgba(15, 61, 46, 0.12);
      }

      .profile-avatar--initials {
        width: 96px;
        height: 96px;
        border-radius: var(--radius-full);
        background: linear-gradient(
          145deg,
          var(--gulf-green-800),
          color-mix(in srgb, var(--gulf-green-700) 82%, var(--gulf-gold) 18%)
        );
        color: var(--gulf-text, #fff);
        font-size: 2rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
        border: 2px solid color-mix(in srgb, var(--gulf-gold) 40%, transparent);
        box-shadow: 0 12px 28px rgba(15, 61, 46, 0.14);
      }

      .profile-main-info {
        display: flex;
        flex-direction: column;
        gap: var(--space-2xs);
        min-width: 0;
      }

      .profile-name {
        font-size: var(--text-h1);
        font-weight: 600;
        margin: 0;
        color: var(--color-text);
        letter-spacing: -0.02em;
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

      .profile-role-badge {
        font-size: var(--text-caption);
        font-weight: 600;
        padding: 4px 10px;
        border-radius: 999px;
        background: color-mix(in srgb, var(--color-bg-elevated) 88%, var(--gulf-green-800) 8%);
        border: 1px solid color-mix(in srgb, var(--gulf-gold) 22%, var(--color-border));
        color: var(--color-text);
      }

      .profile-panel-details {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--space-lg);
      }

      .profile-section__title {
        font-size: var(--text-h3);
        font-weight: 600;
        margin: 0 0 var(--space-md);
        color: var(--color-text);
      }

      .profile-dl {
        margin: 0;
        display: grid;
        grid-template-columns: auto 1fr;
        gap: var(--space-2xs) var(--space-lg);
        font-size: var(--text-body-sm);
      }

      .profile-dl dt {
        color: var(--color-text-muted);
      }

      .profile-dl dd {
        margin: 0;
        color: var(--color-text);
      }
    `,
  ],
})
export class ProfilePageComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly translate = inject(TranslateService);

  readonly user = this.auth.user;

  readonly breadcrumbs = computed(() => [{ label: this.translate.instant('nav.profile') }]);

  /** Support both camelCase (API) and PascalCase (legacy/other) */
  readonly jobTitleDisplay = computed(() => {
    const u = this.user();
    if (!u) return '—';
    const v =
      (u as { jobTitle?: string | null; JobTitle?: string | null }).jobTitle ??
      (u as { jobTitle?: string | null; JobTitle?: string | null }).JobTitle;
    return v != null && v !== '' ? v : '—';
  });
  readonly departmentDisplay = computed(() => {
    const u = this.user();
    if (!u) return '—';
    const v =
      (u as { department?: string | null; Department?: string | null }).department ??
      (u as { department?: string | null; Department?: string | null }).Department;
    return v != null && v !== '' ? v : '—';
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
}
