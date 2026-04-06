import { Component, inject, computed, output, input, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/auth/auth.service';
import { SIDEBAR_GROUPS } from './sidebar-nav.model';
import { TooltipDirective } from '../../shared/tooltip/tooltip.directive';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslateModule, TooltipDirective],
  template: `
    <aside class="sidebar-inner" [class.drawer-open]="drawerOpen()" aria-label="Main navigation">
      @if (drawerOpen()) {
        <button
          type="button"
          class="sidebar-close"
          (click)="closeDrawer.emit()"
          [attr.aria-label]="'common.close' | translate"
          [appTooltip]="'common.close' | translate"
        >
          &times;
        </button>
      }
      <div class="sidebar-top">
        <button
          type="button"
          class="collapse-toggle"
          (click)="toggleCollapsed()"
          [attr.aria-label]="(collapsed() ? 'common.expandSidebar' : 'common.collapseSidebar') | translate"
          [appTooltip]="(collapsed() ? 'common.expandSidebar' : 'common.collapseSidebar') | translate"
        >
          <span class="collapse-icon" [class.collapse-icon--collapsed]="collapsed()" aria-hidden="true"></span>
        </button>
      </div>
      <nav class="nav" aria-label="Primary">
        @for (group of navGroups(); track group.id) {
          <div class="nav-group">
            <button
              type="button"
              class="nav-group-trigger"
              [class.nav-link--collapsed]="collapsed()"
              (click)="onGroupClick(group)"
              [appTooltip]="group.labelKey | translate"
              [tooltipDisabled]="!collapsed()"
            >
              <span class="nav-icon" aria-hidden="true">
                @switch (group.icon) {
                  @case ('dashboard') {
                    <svg class="icon-svg" viewBox="0 0 24 24">
                      <path d="M3 13h8V3H3v10Zm10 8h8V11h-8v10ZM3 21h8v-6H3v6Zm10-18v6h8V3h-8Z" fill="currentColor"/>
                    </svg>
                  }
                  @case ('organization') {
                    <svg class="icon-svg" viewBox="0 0 24 24">
                      <path d="M4 21V9l8-6 8 6v12h-6v-5H10v5H4Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                    </svg>
                  }
                  @case ('competency') {
                    <svg class="icon-svg" viewBox="0 0 24 24">
                      <path d="M12 3 9.5 8l-5 .7L8 12.8 7 18l5-2.7L17 18l-1-5.2 3.5-4.1-5-.7L12 3Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                    </svg>
                  }
                  @case ('programs') {
                    <svg class="icon-svg" viewBox="0 0 24 24">
                      <path d="M4 5h16v3H4V5Zm2 5h12v9H6v-9Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                    </svg>
                  }
                  @case ('knowledge') {
                    <svg class="icon-svg" viewBox="0 0 24 24">
                      <path d="M5 4h9a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Zm9 0h5v16h-5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                    </svg>
                  }
                  @case ('settings') {
                    <svg class="icon-svg" viewBox="0 0 24 24">
                      <path d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm7.5 3a7.5 7.5 0 0 0-.1-1l2-1.5-2-3.5-2.3.7a7.6 7.6 0 0 0-1.7-1L15 2h-6l-.4 2.7a7.6 7.6 0 0 0-1.7 1L4.6 6l-2 3.5L4.5 11a7.5 7.5 0 0 0 0 2l-1.9 1.5 2 3.5 2.3-.7a7.6 7.6 0 0 0 1.7 1L9 22h6l.4-2.7a7.6 7.6 0 0 0 1.7-1l2.3.7 2-3.5-1.9-1.5a7.5 7.5 0 0 0 .1-1Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
                    </svg>
                  }
                  @default {
                    <svg class="icon-svg" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="1.6"/>
                    </svg>
                  }
                }
              </span>
              @if (!collapsed()) {
                <span class="nav-label">{{ group.labelKey | translate }}</span>
                @if (group.items.length > 1) {
                  <span
                    class="nav-group-chevron"
                    [class.nav-group-chevron--open]="isGroupOpen(group.id)"
                    aria-hidden="true"
                  >
                    ▸
                  </span>
                }
              }
            </button>
            @if (!collapsed() && isGroupOpen(group.id) && group.items.length > 1) {
              <div class="nav-group-items">
                @for (item of group.items; track item.route) {
                  <a
                    [routerLink]="item.route"
                    routerLinkActive="active"
                    class="nav-link nav-link--child"
                    (click)="onNavClick()"
                  >
                    <span class="nav-child-icon" aria-hidden="true">
                      @switch (item.icon) {
                        @case ('dashboard') {
                          <svg class="icon-svg" viewBox="0 0 24 24">
                            <path d="M3 13h8V3H3v10Zm10 8h8V11h-8v10Z" fill="currentColor"/>
                          </svg>
                        }
                        @case ('employees') {
                          <svg class="icon-svg" viewBox="0 0 24 24">
                            <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" fill="none" stroke="currentColor" stroke-width="1.6"/>
                            <path d="M4 20v-1a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v1M12 17a4 4 0 0 1 4-3h0a4 4 0 0 1 4 4v2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                          </svg>
                        }
                        @case ('organization') {
                          <svg class="icon-svg" viewBox="0 0 24 24">
                            <path d="M4 21V9l8-6 8 6v12h-6v-5H10v5H4Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                          </svg>
                        }
                        @case ('jobs') {
                          <svg class="icon-svg" viewBox="0 0 24 24">
                            <rect x="4" y="7" width="16" height="11" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="1.6"/>
                            <path d="M9 7V5h6v2" fill="none" stroke="currentColor" stroke-width="1.6"/>
                          </svg>
                        }
                        @case ('positions') {
                          <svg class="icon-svg" viewBox="0 0 24 24">
                            <path d="M12 2 4 7v10l8 5 8-5V7l-8-5Z" fill="none" stroke="currentColor" stroke-width="1.6"/>
                          </svg>
                        }
                        @case ('competency') {
                          <svg class="icon-svg" viewBox="0 0 24 24">
                            <path d="M12 3 9.5 8l-5 .7L8 12.8 7 18l5-2.7L17 18l-1-5.2 3.5-4.1-5-.7L12 3Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                          </svg>
                        }
                        @case ('trainingNeeds') {
                          <svg class="icon-svg" viewBox="0 0 24 24">
                            <path d="M12 2a7 7 0 0 1 7 7c0 3-2 4.5-3.5 5.5-.8.6-1.5 1-1.5 2v1h-4v-1c0-1 .7-1.4 1.5-2C11 13.5 9 12 9 9a3 3 0 0 1 3-3Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                            <circle cx="12" cy="20" r="1" fill="currentColor"/>
                          </svg>
                        }
                        @case ('trainingPlans') {
                          <svg class="icon-svg" viewBox="0 0 24 24">
                            <rect x="4" y="5" width="16" height="15" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="1.6"/>
                            <path d="M4 9h16M9 3v4M15 3v4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                          </svg>
                        }
                        @case ('assessmentCycles') {
                          <svg class="icon-svg" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/>
                            <path d="M12 6v6l4 2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                          </svg>
                        }
                        @case ('managerReviews') {
                          <svg class="icon-svg" viewBox="0 0 24 24">
                            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2V5a2 2 0 0 0-2-2H9Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                            <path d="M9 12l2 2 4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                        }
                        @case ('gapAnalysis') {
                          <svg class="icon-svg" viewBox="0 0 24 24">
                            <path d="M3 17h6v2H3v-2Zm0-5h6v2H3v-2Zm0-5h12v2H3V7Zm10 10h8v2h-8v-2Zm0-5h8v2h-8v-2Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                          </svg>
                        }
                        @case ('programs') {
                          <svg class="icon-svg" viewBox="0 0 24 24">
                            <path d="M4 5h16v3H4V5Zm2 5h12v9H6v-9Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                          </svg>
                        }
                        @case ('enrollments') {
                          <!-- Person + roster list: reads as "who is enrolled in the program" -->
                          <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="8" cy="8" r="3" />
                            <path d="M3.5 20v-.5a4 4 0 0 1 4-4h1a4 4 0 0 1 4 4v.5" />
                            <rect x="13" y="5" width="8.5" height="14" rx="1.5" />
                            <path d="M15.5 9.5h5M15.5 12.5h5M15.5 15.5h3.5" />
                            <path d="M15 18.5l1.2 1 2.3-2.8" />
                          </svg>
                        }
                        @case ('attendance') {
                          <svg class="icon-svg" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.6"/>
                            <path d="M12 8v4l2.5 2.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                          </svg>
                        }
                        @case ('certificates') {
                          <svg class="icon-svg" viewBox="0 0 24 24">
                            <circle cx="12" cy="9" r="4" fill="none" stroke="currentColor" stroke-width="1.6"/>
                            <path d="M9 13.5 7 21l5-2 5 2-2-7.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                          </svg>
                        }
                        @case ('reports') {
                          <svg class="icon-svg" viewBox="0 0 24 24">
                            <path d="M5 19V9m7 10V5m7 14v-7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                          </svg>
                        }
                        @case ('impact') {
                          <svg class="icon-svg" viewBox="0 0 24 24">
                            <path d="M4 19 10 9l4 4 6-9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                        }
                        @case ('knowledgeLibrary') {
                          <svg class="icon-svg" viewBox="0 0 24 24">
                            <path d="M5 4h7a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Zm10 0h4v13h-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                          </svg>
                        }
                        @case ('knowledgeTransfer') {
                          <svg class="icon-svg" viewBox="0 0 24 24">
                            <path d="M7 7h10l-3-3M17 17H7l3 3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                        }
                        @case ('internalExperts') {
                          <svg class="icon-svg" viewBox="0 0 24 24">
                            <path d="M12 5.5 13.5 9H17l-2.8 2 1 3.5L12 12.8 8.8 14.5l1-3.5L7 9h3.5L12 5.5Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                          </svg>
                        }
                        @case ('users') {
                          <svg class="icon-svg" viewBox="0 0 24 24">
                            <path d="M12 12a3 3 0 1 0-3-3 3 3 0 0 0 3 3Z" fill="none" stroke="currentColor" stroke-width="1.6"/>
                            <path d="M5 20a7 7 0 0 1 14 0" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                          </svg>
                        }
                        @case ('roles') {
                          <svg class="icon-svg" viewBox="0 0 24 24">
                            <circle cx="12" cy="7" r="3" fill="none" stroke="currentColor" stroke-width="1.6"/>
                            <path d="M5 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                          </svg>
                        }
                        @case ('settings') {
                          <svg class="icon-svg" viewBox="0 0 24 24">
                            <path d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" fill="none" stroke="currentColor" stroke-width="1.4"/>
                            <path d="M19.5 12a7.5 7.5 0 0 0-.1-1l2-1.5-2-3.5-2.3.7a7.6 7.6 0 0 0-1.7-1L15 2h-6l-.4 2.7a7.6 7.6 0 0 0-1.7 1L4.6 6l-2 3.5L4.5 11a7.5 7.5 0 0 0 0 2l-1.9 1.5 2 3.5 2.3-.7a7.6 7.6 0 0 0 1.7 1L9 22h6l.4-2.7a7.6 7.6 0 0 0 1.7-1l2.3.7 2-3.5-1.9-1.5a7.5 7.5 0 0 0 .1-1Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
                          </svg>
                        }
                        @case ('notifications') {
                          <svg class="icon-svg" viewBox="0 0 24 24">
                            <path d="M5 17h14l-2-3v-4a5 5 0 0 0-10 0v4l-2 3Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                            <path d="M10 19a2 2 0 0 0 4 0" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                          </svg>
                        }
                        @case ('audit') {
                          <svg class="icon-svg" viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="5" fill="none" stroke="currentColor" stroke-width="1.6"/>
                            <path d="m16 16 3 3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                          </svg>
                        }
                        @case ('recycleBin') {
                          <svg class="icon-svg" viewBox="0 0 24 24">
                            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M2 8h20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                            <path d="M12 2v10l4-4-4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                        }
                        @default {
                          <svg class="icon-svg" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="1.6"/>
                          </svg>
                        }
                      }
                    </span>
                    <span class="nav-label">{{ item.labelKey | translate }}</span>
                  </a>
                }
              </div>
            }
          </div>
        }
      </nav>
    </aside>
  `,
  styles: [`
    .sidebar-inner {
      height: 100%;
      width: 100%;
      padding: var(--space-lg) var(--space-md);
      display: flex;
      flex-direction: column;
      font-family: var(--font-sidebar);
      background: var(--color-bg-sidebar);
      position: relative;
      overflow: hidden;
      box-sizing: border-box;
      border-inline-end: 1px solid var(--color-sidebar-border);
      box-shadow: 4px 0 24px rgba(15, 23, 42, 0.06);
    }
    .sidebar-close {
      position: absolute;
      top: var(--space-sm);
      inset-inline-end: var(--space-sm);
      width: 32px;
      height: 32px;
      border: none;
      background: var(--color-bg-hover);
      color: var(--color-sidebar-text);
      font-size: 1.5rem;
      line-height: 1;
      border-radius: var(--radius-sm);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .sidebar-close:hover { background: var(--color-border-light); }
    .sidebar-top {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      margin-bottom: var(--space-xl);
      padding-inline: var(--space-sm);
    }
    .collapse-toggle {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--color-border);
      background: var(--color-bg-subtle);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      padding: 0;
      color: var(--color-sidebar-text);
    }
    .collapse-toggle:hover {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(255, 255, 255, 0.22);
    }
    .collapse-icon {
      width: 14px;
      height: 14px;
      border-radius: 999px;
      border: 2px solid currentColor;
      border-inline-end-width: 0;
      border-block-start-width: 0;
      transform: rotate(45deg);
      transition: transform 0.2s ease;
    }
    .collapse-icon--collapsed {
      transform: rotate(-135deg);
    }
    .nav {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding-inline-end: 4px;
      scrollbar-width: thin;
      scrollbar-color: var(--color-sidebar-scrollbar-thumb) transparent;
    }
    .nav::-webkit-scrollbar {
      width: 6px;
    }
    .nav::-webkit-scrollbar-track {
      background: transparent;
    }
    .nav::-webkit-scrollbar-thumb {
      background: var(--color-sidebar-scrollbar-thumb);
      border-radius: 999px;
    }
    .nav::-webkit-scrollbar-thumb:hover {
      background: rgba(15, 23, 42, 0.35);
    }
    .nav-group {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .nav-group-trigger {
      width: 100%;
      border: none;
      background: transparent;
      cursor: pointer;
      color: var(--color-sidebar-text);
      text-align: start;
      padding: var(--space-xs) var(--space-md);
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      font-size: 1rem;
      font-weight: 600;
    }
    .nav-group-trigger:hover {
      background: var(--color-sidebar-hover);
      color: var(--color-sidebar-text);
    }
    .nav-group-items {
      display: flex;
      flex-direction: column;
      gap: 2px;
      margin-inline-start: var(--space-lg);
    }
    .nav-link {
      color: var(--color-sidebar-text-muted);
      text-decoration: none;
      padding: var(--space-xs) var(--space-md);
      border-radius: var(--radius-sm);
      font-size: 0.9375rem;
      font-weight: 500;
      transition: background 0.2s ease, color 0.2s ease;
      display: flex;
      align-items: center;
      gap: var(--space-xs);
      position: relative;
    }
    .nav-link--child {
      padding-inline-start: 0;
    }
    .nav-link:hover {
      background: var(--color-sidebar-hover);
      color: var(--color-sidebar-text);
    }
    .nav-link.active {
      background: var(--color-sidebar-active);
      color: var(--color-sidebar-text);
      font-weight: 600;
    }
    .nav-link.active::before {
      content: '';
      position: absolute;
      inset-block: 6px;
      inset-inline-end: 6px;
      width: 3px;
      border-radius: 999px;
      background: var(--color-sidebar-indicator);
    }
    .nav-link--collapsed {
      justify-content: center;
      padding-inline: var(--space-sm);
    }
    .nav-icon {
      width: 28px;
      height: 28px;
      border-radius: 999px;
      background: var(--color-sidebar-icon-bg);
      color: var(--color-sidebar-text);
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.95rem;
    }
    .nav-group-trigger:hover .nav-icon {
      background: var(--color-sidebar-icon-bg-hover);
      color: var(--color-sidebar-text);
    }
    .nav-child-icon {
      width: 20px;
      height: 20px;
      border-radius: 999px;
      background: transparent;
      color: var(--color-sidebar-text-muted);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
    }
    .nav-link:hover .nav-child-icon,
    .nav-link.active .nav-child-icon {
      color: var(--color-sidebar-text);
    }
    .nav-group-chevron {
      margin-inline-start: auto;
      font-size: 0.75rem;
      color: var(--color-sidebar-text-muted);
      opacity: 0.9;
      transform: rotate(0deg);
      transition: transform 0.15s ease;
    }
    .nav-group-chevron--open {
      transform: rotate(90deg); /* السهم لتحت لما الجروب يبقى مفتوح */
    }
    .nav-label {
      white-space: nowrap;
    }
  `]
})
export class SidebarComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  drawerOpen = input<boolean>(false);
  collapsed = input<boolean>(false);
  closeDrawer = output<void>();
  collapsedChange = output<boolean>();

  private readonly internalCollapsed = signal(false);
  private readonly openGroups = signal<Record<string, boolean>>({});

  onNavClick(): void {
    if (this.drawerOpen()) this.closeDrawer.emit();
  }

  toggleCollapsed(): void {
    const next = !this.collapsed();
    this.internalCollapsed.set(next);
    this.collapsedChange.emit(next);
  }

  readonly visibleItems = computed(() => {
    this.auth.user();
    return SIDEBAR_GROUPS.map(group => ({
      ...group,
      items: group.items.filter(item => this.auth.hasAnyPermission(item.permissions)),
    })).filter(group => group.items.length > 0);
  });

  readonly navGroups = this.visibleItems;

  onGroupClick(group: { id: string; items: { route: string }[] }): void {
    // لو الجروب فيه عنصر واحد بس (زي الكفاءات)، نذهب مباشرة للرابط بدون فتح قائمة فرعية
    if (group.items.length === 1) {
      const target = group.items[0];
      this.router.navigateByUrl(target.route);
      this.onNavClick();
      return;
    }
    this.toggleGroup(group.id);
  }

  isGroupOpen(id: string): boolean {
    return !!this.openGroups()[id];
  }

  toggleGroup(id: string): void {
    const current = this.openGroups();
    this.openGroups.set({
      ...current,
      [id]: !current[id],
    });
  }
}
