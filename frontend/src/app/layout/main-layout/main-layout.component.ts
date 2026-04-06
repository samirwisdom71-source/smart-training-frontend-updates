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
      height: 100vh;
      background: var(--color-bg);
    }
    .layout-body {
      display: flex;
      flex-direction: row;
      flex: 1;
      min-height: 0;
    }
    [dir='rtl'] .layout-body {
      flex-direction: row-reverse;
    }
    .sidebar-toggle {
      display: none;
      position: fixed;
      top: calc(var(--header-height) + var(--space-md));
      inset-inline-start: var(--space-md);
      z-index: 1001;
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md);
      border: 1px solid color-mix(in srgb, var(--gulf-gold) 35%, var(--color-border));
      background: color-mix(in srgb, var(--color-bg-elevated) 92%, var(--gulf-green-800) 8%);
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: var(--shadow-sm);
      transition: transform 0.2s ease, border-color 0.2s ease;
    }
    .sidebar-toggle:hover {
      background: var(--color-bg-hover);
      border-color: var(--gulf-gold);
    }
    .sidebar-toggle-icon {
      width: 20px;
      height: 2px;
      background: var(--color-primary);
      box-shadow: 0 6px 0 var(--color-primary), 0 -6px 0 var(--color-primary);
    }
    .sidebar-backdrop {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 999;
      background: rgba(12, 47, 37, 0.55);
      backdrop-filter: blur(2px);
    }
    .sidebar {
      width: var(--sidebar-width-expanded);
      flex-shrink: 0;
      background: transparent;
      box-shadow: none;
      transition: width 0.32s cubic-bezier(0.4, 0, 0.2, 1);
      position: sticky;
      top: var(--header-height);
      align-self: flex-start;
      height: calc(100vh - var(--header-height));
      display: flex;
    }
    .sidebar.sidebar--collapsed {
      width: var(--sidebar-width-collapsed);
    }
    .main {
      flex: 1;
      min-width: 0;
      min-height: 0;
      padding: var(--space-md) var(--space-lg);
      overflow: auto;
    }
    @media (min-width: 769px) and (max-width: 1100px) {
      .sidebar:not(.sidebar--collapsed) {
        width: min(var(--sidebar-width-expanded), 240px);
      }
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
        width: min(var(--sidebar-width-expanded), 88vw);
        z-index: 1000;
        transform: translateX(-100%);
        transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: var(--shadow-xl);
      }
      [dir='rtl'] .sidebar {
        inset-inline-start: auto;
        inset-inline-end: 0;
        transform: translateX(100%);
      }
      .sidebar.drawer-open {
        transform: translateX(0);
      }
      .sidebar-backdrop { display: block; }
      .main { padding: var(--space-sm) var(--space-md); }
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
