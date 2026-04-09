import { Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

export interface BreadcrumbItem {
  label: string;
  route?: string;
}

@Component({
  selector: 'app-page-shell',
  standalone: true,
  imports: [TranslateModule],
  template: `
    <div class="page-shell" [class.page-shell--full-width]="fullWidth()">
      @if (showBack() || showPageTitle()) {
        <header class="page-shell__header">
          <div class="page-shell__header-row">
            @if (showBack()) {
              <button
                type="button"
                class="page-shell-back"
                (click)="goBack()"
                [attr.aria-label]="'common.back' | translate"
              >
                <span class="page-shell-back__icon-wrap" aria-hidden="true">
                  <svg class="page-shell-back__icon" viewBox="0 0 20 20" focusable="false">
                    <path
                      d="M12.5 15 7 9.5 12.5 4"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.75"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </span>
                <span class="page-shell-back__label">{{ 'common.back' | translate }}</span>
              </button>
            }
            @if (showPageTitle()) {
              <h1 class="page-shell__title">{{ title() }}</h1>
            }
          </div>
        </header>
      }
      <div class="page-shell__content">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .page-shell {
    /* padding: var(--space-lg); max-width: var(--content-max-width); margin: 0 auto; */
    }
    .page-shell.page-shell--full-width {
      max-width: none;
      width: 100%;
      margin: 0;
      padding: var(--space-sm) 0 var(--space-xl);
    }
    .page-shell__header {
      margin-bottom: var(--space-lg);
    }
    .page-shell__header-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-md);
    }
    .page-shell__title {
      margin: 0;
      flex: 1;
      min-width: min(100%, 12rem);
      font-size: var(--text-display-2);
      font-weight: 600;
      color: var(--color-text);
      letter-spacing: -0.02em;
      line-height: 1.15;
    }
    .page-shell-back {
      display: inline-flex;
      align-items: center;
      gap: 0.55rem;
      margin: 0;
      padding: 0.5rem 1.05rem 0.5rem 0.6rem;
      border: 1px solid color-mix(in srgb, var(--color-text) 14%, transparent);
      border-radius: 999px;
      background: color-mix(in srgb, var(--color-surface, #fff) 88%, var(--color-primary, #0d6b4d) 4%);
      color: var(--color-text);
      font-family: var(--font-sans, 'Cairo', 'Segoe UI', system-ui, sans-serif);
      font-size: var(--text-sm, 0.875rem);
      font-weight: 600;
      letter-spacing: 0.02em;
      line-height: 1.25;
      cursor: pointer;
      box-shadow:
        0 1px 2px color-mix(in srgb, var(--color-text) 6%, transparent),
        0 0 0 1px color-mix(in srgb, var(--color-text) 4%, transparent);
      transition:
        background 240ms cubic-bezier(0.22, 1, 0.36, 1),
        border-color 240ms cubic-bezier(0.22, 1, 0.36, 1),
        box-shadow 280ms cubic-bezier(0.22, 1, 0.36, 1),
        transform 240ms cubic-bezier(0.22, 1, 0.36, 1),
        color 240ms ease;
    }
    .page-shell-back:hover {
      background: color-mix(in srgb, var(--color-surface, #fff) 68%, var(--color-primary, #0d6b4d) 18%);
      border-color: color-mix(in srgb, var(--color-primary, #0d6b4d) 45%, transparent);
      box-shadow:
        0 6px 22px color-mix(in srgb, var(--color-primary, #0d6b4d) 22%, transparent),
        0 2px 6px color-mix(in srgb, var(--color-text) 8%, transparent),
        0 0 0 1px color-mix(in srgb, var(--color-primary, #0d6b4d) 28%, transparent),
        inset 0 1px 0 color-mix(in srgb, #fff 55%, transparent);
      transform: translateY(-2px);
      color: color-mix(in srgb, var(--color-text) 20%, var(--color-primary, #0d6b4d));
    }
    .page-shell-back:focus-visible {
      outline: 2px solid color-mix(in srgb, var(--color-primary, #0d6b4d) 55%, transparent);
      outline-offset: 2px;
    }
    .page-shell-back:active {
      transform: translateY(0);
      box-shadow:
        0 1px 4px color-mix(in srgb, var(--color-text) 10%, transparent),
        0 0 0 1px color-mix(in srgb, var(--color-primary, #0d6b4d) 20%, transparent);
      transition-duration: 120ms;
    }
    .page-shell-back__icon-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.85rem;
      height: 1.85rem;
      border-radius: 50%;
      background: color-mix(in srgb, var(--color-primary, #0d6b4d) 12%, transparent);
      color: var(--color-primary, #0d6b4d);
      transition:
        background 240ms cubic-bezier(0.22, 1, 0.36, 1),
        color 240ms ease,
        transform 260ms cubic-bezier(0.34, 1.4, 0.64, 1),
        box-shadow 240ms ease;
    }
    .page-shell-back:hover .page-shell-back__icon-wrap {
      background: color-mix(in srgb, var(--color-primary, #0d6b4d) 26%, transparent);
      color: var(--color-primary, #0d6b4d);
      transform: scale(1.06);
      box-shadow:
        0 0 0 1px color-mix(in srgb, var(--color-primary, #0d6b4d) 35%, transparent),
        0 3px 10px color-mix(in srgb, var(--color-primary, #0d6b4d) 18%, transparent);
    }
    .page-shell-back__icon {
      width: 1rem;
      height: 1rem;
      display: block;
      transition: transform 260ms cubic-bezier(0.34, 1.4, 0.64, 1);
    }
    .page-shell-back:hover .page-shell-back__icon {
      transform: translateX(-3px);
    }
    :host-context([dir='rtl']) .page-shell-back__icon {
      transform: scaleX(-1);
    }
    :host-context([dir='rtl']) .page-shell-back:hover .page-shell-back__icon {
      transform: scaleX(-1) translateX(3px);
    }
    .page-shell-back__label {
      padding-inline-end: 0.2rem;
    }
    .page-shell__content { min-height: 200px; }
  `]
})
export class PageShellComponent {
  title = input.required<string>();
  breadcrumbs = input<BreadcrumbItem[]>([]);
  /** When true, shell spans the full main area width (no content max-width cap). */
  fullWidth = input(false);
  /** When false, the top H1 title row is omitted (content still receives the same `title` input if needed). */
  showPageTitle = input(true);
  /** History back control for detail / drill-in screens */
  showBack = input(false);

  goBack(): void {
    window.history.back();
  }
}
