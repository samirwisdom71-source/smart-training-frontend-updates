import { Component, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../core/notifications/notification.service';
import { NotificationBellComponent } from './notification-bell/notification-bell.component';
import { LanguageSwitcherComponent } from './language-switcher/language-switcher.component';
import { TranslateModule } from '@ngx-translate/core';
import { appConfig } from '../../config/app.config';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NotificationBellComponent, LanguageSwitcherComponent, TranslateModule, RouterLink],
  template: `
    <header class="header-inner">
      <div class="header-start">
        <img src="/assets/images/logo.png" alt="{{ 'app.shortTitle' | translate }}" class="header-logo" />
        <h1 class="page-title">{{ 'app.shortTitle' | translate }}</h1>
      </div>
      <div class="header-end">
        @if (auth.user(); as user) {
          <app-notification-bell />
          <app-language-switcher />
          <div class="user-block" [class.user-block--open]="menuOpen" (click)="$event.stopPropagation()">
            <button type="button" class="user-trigger" (click)="toggleMenu()" [attr.aria-expanded]="menuOpen">
              @if (user.profilePicturePath) {
                <img [src]="profileImageUrl(user.profilePicturePath)" alt="" class="user-avatar user-avatar--img" />
              } @else {
                <span class="user-avatar user-avatar--initials" [attr.aria-label]="user.fullName">
                  {{ initials(user.fullName) }}
                </span>
              }
              <span class="user-name">{{ user.fullName }}</span>
              <svg class="user-chevron" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 10l5 5 5-5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
            @if (menuOpen) {
              <div class="user-menu">
                <a routerLink="/profile" class="user-menu__item">{{ 'nav.profile' | translate }}</a>
                <button type="button" class="user-menu__item user-menu__item--danger" (click)="logout()">
                  {{ 'auth.logout' | translate }}
                </button>
              </div>
            }
          </div>
        }
      </div>
    </header>
  `,
  styles: [`
    :host {
      display: block;
      background: var(--color-bg-header);
      border-bottom: 1px solid var(--color-header-border);
    }
    .header-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-inline: var(--space-xl);
      min-height: var(--header-height);
      gap: var(--space-md);
      color: var(--color-header-text);
    }
    .header-start {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
    }
    .header-logo {
      width: 32px;
      height: 32px;
      object-fit: contain;
    }
    .page-title {
      margin: 0;
      font-size: var(--text-h2);
      font-weight: 600;
      color: var(--color-header-text);
      letter-spacing: -0.01em;
    }
    @media (max-width: 768px) {
      .page-title {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 50vw;
      }
    }
    .header-end {
      display: flex;
      align-items: center;
      gap: var(--space-md);
    }
    .user-block {
      position: relative;
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      padding-inline-start: var(--space-md);
      border-inline-start: 1px solid var(--color-border-light);
    }
    .user-trigger {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      color: inherit;
    }
    .user-trigger:hover {
      background: var(--color-header-hover);
      border-radius: var(--radius-sm);
      padding: 4px 6px;
      margin: -4px -6px;
    }
    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-full);
      flex-shrink: 0;
    }
    .user-avatar--img {
      object-fit: cover;
      display: block;
    }
    .user-avatar--initials {
      background: var(--color-primary-muted);
      color: var(--color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--text-caption);
      font-weight: 600;
    }
    .user-name {
      font-size: var(--text-body-sm);
      font-weight: 500;
      color: var(--color-header-text);
    }
    .user-chevron {
      width: 16px;
      height: 16px;
      color: var(--color-header-text);
    }
    .user-menu {
      position: absolute;
      inset-block-start: calc(100% + 4px);
      inset-inline-end: 0;
      min-width: 180px;
      background: var(--color-bg-elevated);
      border: 1px solid var(--color-border-light);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-md);
      padding: 4px;
      z-index: 20;
    }
    .user-menu__item {
      display: block;
      width: 100%;
      padding: 8px 12px;
      text-align: start;
      border: none;
      background: none;
      font-size: var(--text-body-sm);
      color: var(--color-text);
      text-decoration: none;
      cursor: pointer;
      border-radius: var(--radius-sm);
    }
    .user-menu__item:hover {
      background: var(--color-bg-hover);
    }
    .user-menu__item--danger {
      color: var(--color-danger, #b91c1c);
    }
  `]
})
export class HeaderComponent {
  constructor(
    public auth: AuthService,
    private notifications: NotificationService
  ) {}
  menuOpen = false;

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  @HostListener('document:click')
  closeMenuOnOutsideClick(): void {
    if (this.menuOpen) {
      this.menuOpen = false;
    }
  }

  logout(): void {
    this.menuOpen = false;
    this.notifications.disconnectHub();
    this.auth.logout();
  }

  initials(fullName: string): string {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return fullName.slice(0, 2).toUpperCase();
  }

  profileImageUrl(path: string | null | undefined): string {
    if (!path) return '';
    // لو الـ API رجّع URL كامل
    if (path.startsWith('http')) return path;
    // لو رجّع مسار من الـ API (مثلاً /files/...)
    if (path.startsWith('/')) return `${appConfig.apiUrl}${path}`;
    // لو رجّع مسار ويندوز أو اسم ملف فقط → نخليه تحت profile-photos
    const normalized = path.replace(/\\/g, '/');
    const parts = normalized.split('/');
    const fileName = parts[parts.length - 1];
    return `${appConfig.apiUrl}/files/profile-photos/${fileName}`;
  }
}
