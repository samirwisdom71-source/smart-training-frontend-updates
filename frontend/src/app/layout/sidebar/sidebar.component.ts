import { Component, effect, inject, computed, output, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs/operators';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/auth/auth.service';
import { SIDEBAR_GROUPS } from './sidebar-nav.model';
import { TooltipDirective } from '../../shared/tooltip/tooltip.directive';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslateModule, TooltipDirective],
  template: `
    <aside
      class="sidebar-inner"
      [class.sidebar-inner--collapsed]="collapsed()"
      [class.drawer-open]="drawerOpen()"
      aria-label="Main navigation"
    >
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
      <div class="sidebar-brand-row">
        @if (!collapsed()) {
          <a
            routerLink="/dashboard"
            class="sidebar-brand"
            (click)="onNavClick()"
          >
            <img
              class="sidebar-brand__logo"
              src="/assets/images/logo4.png"
              width="44"
              height="44"
              alt=""
            />
            <span class="sidebar-brand__text">{{ 'app.shortTitle' | translate }}</span>
          </a>
        }
        <button
          type="button"
          class="collapse-toggle"
          (click)="toggleCollapsed()"
          [attr.aria-label]="(collapsed() ? 'common.expandSidebar' : 'common.collapseSidebar') | translate"
          [appTooltip]="(collapsed() ? 'common.expandSidebar' : 'common.collapseSidebar') | translate"
        >
          <svg
            class="collapse-toggle__icon"
            [class.collapse-toggle__icon--collapsed]="collapsed()"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              d="M15 22.75H9C3.57 22.75 1.25 20.43 1.25 15V9C1.25 3.57 3.57 1.25 9 1.25H15C20.43 1.25 22.75 3.57 22.75 9V15C22.75 20.43 20.43 22.75 15 22.75ZM9 2.75C4.39 2.75 2.75 4.39 2.75 9V15C2.75 19.61 4.39 21.25 9 21.25H15C19.61 21.25 21.25 19.61 21.25 15V9C21.25 4.39 19.61 2.75 15 2.75H9Z"
            />
            <path
              fill="currentColor"
              d="M10.7399 16.2802C10.5499 16.2802 10.3599 16.2102 10.2099 16.0602C9.91993 15.7702 9.91993 15.2902 10.2099 15.0002L13.2099 12.0002L10.2099 9.00016C9.91993 8.71016 9.91993 8.23016 10.2099 7.94016C10.4999 7.65016 10.9799 7.65016 11.2699 7.94016L14.7999 11.4702C15.0899 11.7602 15.0899 12.2402 14.7999 12.5302L11.2699 16.0602C11.1199 16.2102 10.9299 16.2802 10.7399 16.2802Z"
            />
          </svg>
        </button>
      </div>
      <nav class="nav" aria-label="Primary">
        @for (group of navGroups(); track group.id) {
          <div
            class="nav-section"
            [class.nav-section--open]="
              !collapsed() && group.items.length > 1 && isGroupOpen(group.id)
            "
          >
            <div class="nav-group">
            <button
              type="button"
              class="nav-group-trigger"
              [class.nav-link--collapsed]="collapsed()"
              [attr.aria-expanded]="
                group.items.length > 1 ? isGroupOpen(group.id) : undefined
              "
              (click)="onGroupClick(group)"
              [appTooltip]="group.labelKey | translate"
              [tooltipDisabled]="!collapsed()"
            >
              <span class="nav-icon" aria-hidden="true">
                @switch (group.icon) {
                  @case ('dashboard') {
                    <svg xmlns="http://www.w3.org/2000/svg"  class="icon-svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
<g clip-path="url(#clip0_4418_7634)">
<path d="M17.79 22.7402H6.21C3.47 22.7402 1.25 20.5102 1.25 17.7702V10.3602C1.25 9.00021 2.09 7.29021 3.17 6.45021L8.56 2.25021C10.18 0.990208 12.77 0.930208 14.45 2.11021L20.63 6.44021C21.82 7.27021 22.75 9.05021 22.75 10.5002V17.7802C22.75 20.5102 20.53 22.7402 17.79 22.7402ZM9.48 3.43021L4.09 7.63021C3.38 8.19021 2.75 9.46021 2.75 10.3602V17.7702C2.75 19.6802 4.3 21.2402 6.21 21.2402H17.79C19.7 21.2402 21.25 19.6902 21.25 17.7802V10.5002C21.25 9.54021 20.56 8.21021 19.77 7.67021L13.59 3.34021C12.45 2.54021 10.57 2.58021 9.48 3.43021Z" fill="white" style="fill: var(--fillg);"/>
<path d="M7.49994 17.2495C7.30994 17.2495 7.11994 17.1795 6.96994 17.0295C6.67994 16.7395 6.67994 16.2595 6.96994 15.9695L10.1699 12.7695C10.3299 12.6095 10.5399 12.5295 10.7699 12.5495C10.9899 12.5695 11.1899 12.6895 11.3199 12.8795L12.4099 14.5195L15.9599 10.9695C16.2499 10.6795 16.7299 10.6795 17.0199 10.9695C17.3099 11.2595 17.3099 11.7395 17.0199 12.0295L12.8199 16.2295C12.6599 16.3895 12.4499 16.4695 12.2199 16.4495C11.9999 16.4295 11.7999 16.3095 11.6699 16.1195L10.5799 14.4795L8.02994 17.0295C7.87994 17.1795 7.68994 17.2495 7.49994 17.2495Z" fill="white" style="fill: var(--fillg);"/>
<path d="M16.5 14.25C16.09 14.25 15.75 13.91 15.75 13.5V12.25H14.5C14.09 12.25 13.75 11.91 13.75 11.5C13.75 11.09 14.09 10.75 14.5 10.75H16.5C16.91 10.75 17.25 11.09 17.25 11.5V13.5C17.25 13.91 16.91 14.25 16.5 14.25Z" fill="white" style="fill: var(--fillg);"/>
</g>
<defs>
<clipPath id="clip0_4418_7634">
<rect width="24" height="24" fill="white"/>
</clipPath>
</defs>
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
<path d="M12 22.75C6.07 22.75 1.25 17.93 1.25 12C1.25 6.07 6.07 1.25 12 1.25C17.93 1.25 22.75 6.07 22.75 12C22.75 17.93 17.93 22.75 12 22.75ZM12 2.75C6.9 2.75 2.75 6.9 2.75 12C2.75 17.1 6.9 21.25 12 21.25C17.1 21.25 21.25 17.1 21.25 12C21.25 6.9 17.1 2.75 12 2.75Z" fill="white" style="fill: var(--fillg);"/>
<path d="M10.7399 16.2802C10.5499 16.2802 10.3599 16.2102 10.2099 16.0602C9.91993 15.7702 9.91993 15.2902 10.2099 15.0002L13.2099 12.0002L10.2099 9.00016C9.91993 8.71016 9.91993 8.23016 10.2099 7.94016C10.4999 7.65016 10.9799 7.65016 11.2699 7.94016L14.7999 11.4702C15.0899 11.7602 15.0899 12.2402 14.7999 12.5302L11.2699 16.0602C11.1199 16.2102 10.9299 16.2802 10.7399 16.2802Z" fill="white" style="fill: var(--fillg);"/>
</svg>
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
                          <svg  class="icon-svg" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
<g clip-path="url(#clip0_4418_7634)">
<path d="M17.79 22.7402H6.21C3.47 22.7402 1.25 20.5102 1.25 17.7702V10.3602C1.25 9.00021 2.09 7.29021 3.17 6.45021L8.56 2.25021C10.18 0.990208 12.77 0.930208 14.45 2.11021L20.63 6.44021C21.82 7.27021 22.75 9.05021 22.75 10.5002V17.7802C22.75 20.5102 20.53 22.7402 17.79 22.7402ZM9.48 3.43021L4.09 7.63021C3.38 8.19021 2.75 9.46021 2.75 10.3602V17.7702C2.75 19.6802 4.3 21.2402 6.21 21.2402H17.79C19.7 21.2402 21.25 19.6902 21.25 17.7802V10.5002C21.25 9.54021 20.56 8.21021 19.77 7.67021L13.59 3.34021C12.45 2.54021 10.57 2.58021 9.48 3.43021Z" fill="white" style="fill: var(--fillg);"/>
<path d="M7.49994 17.2495C7.30994 17.2495 7.11994 17.1795 6.96994 17.0295C6.67994 16.7395 6.67994 16.2595 6.96994 15.9695L10.1699 12.7695C10.3299 12.6095 10.5399 12.5295 10.7699 12.5495C10.9899 12.5695 11.1899 12.6895 11.3199 12.8795L12.4099 14.5195L15.9599 10.9695C16.2499 10.6795 16.7299 10.6795 17.0199 10.9695C17.3099 11.2595 17.3099 11.7395 17.0199 12.0295L12.8199 16.2295C12.6599 16.3895 12.4499 16.4695 12.2199 16.4495C11.9999 16.4295 11.7999 16.3095 11.6699 16.1195L10.5799 14.4795L8.02994 17.0295C7.87994 17.1795 7.68994 17.2495 7.49994 17.2495Z" fill="white" style="fill: var(--fillg);"/>
<path d="M16.5 14.25C16.09 14.25 15.75 13.91 15.75 13.5V12.25H14.5C14.09 12.25 13.75 11.91 13.75 11.5C13.75 11.09 14.09 10.75 14.5 10.75H16.5C16.91 10.75 17.25 11.09 17.25 11.5V13.5C17.25 13.91 16.91 14.25 16.5 14.25Z" fill="white" style="fill: var(--fillg);"/>
</g>
<defs>
<clipPath id="clip0_4418_7634">
<rect width="24" height="24" fill="white"/>
</clipPath>
</defs>
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
                          <svg xmlns="http://www.w3.org/2000/svg" class="icon-svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
<g clip-path="url(#clip0_4418_7623)">
<path d="M22 22.75H2C1.59 22.75 1.25 22.41 1.25 22C1.25 21.59 1.59 21.25 2 21.25H22C22.41 21.25 22.75 21.59 22.75 22C22.75 22.41 22.41 22.75 22 22.75Z" fill="white" style="fill: var(--fillg);"/>
<path d="M14.25 22.75H9.75C9.34 22.75 9 22.41 9 22V4C9 2.28 9.95 1.25 11.55 1.25H12.45C14.05 1.25 15 2.28 15 4V22C15 22.41 14.66 22.75 14.25 22.75ZM10.5 21.25H13.5V4C13.5 2.85 12.96 2.75 12.45 2.75H11.55C11.04 2.75 10.5 2.85 10.5 4V21.25Z" fill="white" style="fill: var(--fillg);"/>
<path d="M7 22.75H3C2.59 22.75 2.25 22.41 2.25 22V10C2.25 8.28 3.13 7.25 4.6 7.25H5.4C6.87 7.25 7.75 8.28 7.75 10V22C7.75 22.41 7.41 22.75 7 22.75ZM3.75 21.25H6.25V10C6.25 8.75 5.7 8.75 5.4 8.75H4.6C4.3 8.75 3.75 8.75 3.75 10V21.25Z" fill="white" style="fill: var(--fillg);"/>
<path d="M21 22.75H17C16.59 22.75 16.25 22.41 16.25 22V15C16.25 13.28 17.13 12.25 18.6 12.25H19.4C20.87 12.25 21.75 13.28 21.75 15V22C21.75 22.41 21.41 22.75 21 22.75ZM17.75 21.25H20.25V15C20.25 13.75 19.7 13.75 19.4 13.75H18.6C18.3 13.75 17.75 13.75 17.75 15V21.25Z" fill="white" style="fill: var(--fillg);"/>
</g>
<defs>
<clipPath id="clip0_4418_7623">
<rect width="24" height="24" fill="white"/>
</clipPath>
</defs>
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
          </div>
        }
      </nav>
    </aside>
  `,
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  drawerOpen = input<boolean>(false);
  collapsed = input<boolean>(false);
  closeDrawer = output<void>();
  collapsedChange = output<boolean>();

  private readonly openGroups = signal<Record<string, boolean>>({});

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.syncOpenGroupFromUrl());
    this.syncOpenGroupFromUrl();

    effect(() => {
      this.navGroups();
      this.syncOpenGroupFromUrl();
    });
  }

  onNavClick(): void {
    if (this.drawerOpen()) this.closeDrawer.emit();
  }

  toggleCollapsed(): void {
    this.collapsedChange.emit(!this.collapsed());
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
    if (current[id]) {
      this.openGroups.set({});
      return;
    }
    this.openGroups.set({ [id]: true });
  }

  /** Keep the section that contains the current route expanded (accordion: single open). */
  private syncOpenGroupFromUrl(): void {
    const url = this.router.url.split('?')[0];
    for (const g of this.navGroups()) {
      if (g.items.length <= 1) continue;
      const hit = g.items.some(
        item =>
          url === item.route ||
          (item.route.length > 1 && url.startsWith(`${item.route}/`)),
      );
      if (hit) {
        this.openGroups.set({ [g.id]: true });
        return;
      }
    }
  }
}
