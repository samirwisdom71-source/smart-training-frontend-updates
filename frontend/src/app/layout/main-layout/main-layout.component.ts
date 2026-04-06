import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { ToastContainerComponent } from '../../core/toast/toast-container.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent, ToastContainerComponent, TranslateModule],
  template: `
    <div class="main-layout">
      <app-header class="header" />
      <div class="layout-body">
        <button
          type="button"
          class="sidebar-toggle"
          (click)="toggleSidebar()"
          [attr.aria-expanded]="sidebarOpen()"
          aria-label="Toggle menu"
        >
          <span class="sidebar-toggle-icon" aria-hidden="true"></span>
        </button>
        @if (sidebarOpen()) {
          <div
            class="sidebar-backdrop"
            (click)="closeSidebar()"
            role="button"
            tabindex="-1"
            [attr.aria-label]="'common.close' | translate"
          ></div>
        }
        <app-sidebar
          class="sidebar"
          [class.sidebar--collapsed]="sidebarCollapsed()"
          [drawerOpen]="sidebarOpen()"
          [collapsed]="sidebarCollapsed()"
          [class.drawer-open]="sidebarOpen()"
          (closeDrawer)="closeSidebar()"
          (collapsedChange)="onSidebarCollapsedChange($event)"
        />
        <main class="main" id="main-content" role="main">
          <router-outlet />
        </main>
      </div>
      <app-toast-container />
    </div>
  `,
  styles: [`
    .main-layout {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background: var(--color-bg);
    }
    .layout-body {
      display: flex;
      flex: 1;
      min-height: 0;
    }
    .sidebar-toggle {
      display: none;
      position: fixed;
      top: calc(var(--header-height) + var(--space-md));
      inset-inline-start: var(--space-md);
      z-index: 1001;
      width: 40px;
      height: 40px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--color-border);
      background: var(--color-bg-elevated);
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: var(--shadow-sm);
    }
    .sidebar-toggle:hover { background: var(--color-bg-hover); }
    .sidebar-toggle-icon {
      width: 20px;
      height: 2px;
      background: var(--color-text);
      box-shadow: 0 6px 0 var(--color-text), 0 -6px 0 var(--color-text);
    }
    .sidebar-backdrop {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 999;
      background: rgba(15, 23, 42, 0.4);
    }
    .sidebar {
      width: 240px;
      flex-shrink: 0;
      background: transparent;
      box-shadow: none;
      transition: width 0.2s ease;
      position: sticky;
      top: var(--header-height);
      height: calc(100vh - var(--header-height));
      display: flex;
    }
    .sidebar.sidebar--collapsed {
      width: 80px; /* حافظنا على فرق مريح مع الوضع العادي */
    }
    .main {
      flex: 1;
      padding: var(--space-xl);
      overflow: auto;
    }
    @media (max-width: 768px) {
      .sidebar-toggle { display: flex; }
      .layout-body {
        position: relative;
      }
      .sidebar {
        position: fixed;
        top: var(--header-height);
        bottom: 0;
        inset-inline-start: 0;
        width: var(--sidebar-width);
        max-width: 85vw;
        z-index: 1000;
        transform: translateX(-100%);
        transition: transform 0.2s ease;
        box-shadow: var(--shadow-lg);
      }
      [dir="rtl"] .sidebar { transform: translateX(100%); }
      .sidebar.drawer-open { transform: translateX(0); }
      [dir="rtl"] .sidebar.drawer-open { transform: translateX(0); }
      .sidebar-backdrop { display: block; }
      .main { padding: var(--space-md); }
    }
  `]
})
export class MainLayoutComponent {
  readonly sidebarOpen = signal(false);
  readonly sidebarCollapsed = signal(false);

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  onSidebarCollapsedChange(collapsed: boolean): void {
    this.sidebarCollapsed.set(collapsed);
  }
}
