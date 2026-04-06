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
        <a
          routerLink="/dashboard"
          class="header-brand"
          [attr.aria-label]="'app.shortTitle' | translate"
        >
          <img
            src="/assets/images/logo4.png"
            alt=""
            class="header-logo"
            width="40"
            height="40"
          />
          <div class="header-titles">
            <h1 class="page-title">{{ 'app.shortTitle' | translate }}</h1>
          </div>
        </a>
      </div>
      <div class="header-end">
        @if (auth.user(); as user) {
          <app-notification-bell />
          <app-language-switcher />
          <div
            class="user-block"
            [class.user-block--open]="menuOpen"
            (click)="$event.stopPropagation()"
          >
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
  styleUrl: './header.component.scss',
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
