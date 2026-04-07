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
      <app-header
        class="header"
        [sidebarOpen]="sidebarOpen()"
        (sidebarMenuToggle)="toggleSidebar()"
      />
      <div class="layout-body">
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
    .sidebar-backdrop {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 998;
      background: rgba(12, 47, 37, 0.55);
      backdrop-filter: blur(2px);
    }
    /*
     * Sidebar shell layout lives on <app-sidebar> (:host in sidebar.component.scss).
     * Do not set position/width/flex here — it breaks the mobile fixed overlay.
     */
    .main {
      flex: 1;
      min-width: 0;
      min-height: 0;
      padding: var(--space-md) var(--space-lg);
      overflow: auto;
    }
    @media (max-width: 1200px) {
      .layout-body {
        position: relative;
        flex-direction: column !important;
      }
      [dir='rtl'] .layout-body {
        flex-direction: column !important;
      }
      .sidebar-backdrop { display: block; }
      .main {
        flex: 1 1 auto;
        width: 100%;
        max-width: 100%;
        min-width: 0;
        padding: var(--space-sm) var(--space-md);
      }
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
