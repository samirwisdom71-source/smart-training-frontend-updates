import { Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { LocaleService } from '../../../core/i18n/locale.service';
import { TooltipDirective } from '../../../shared/tooltip/tooltip.directive';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [TranslateModule, TooltipDirective],
  template: `
    <div
      class="lang-toggle"
      [class.lang-toggle--en]="locale.currentLang === 'en'"
      role="group"
      [attr.aria-label]="'header.language' | translate"
      [appTooltip]="locale.getLangLabel('ar') + ' ↔ ' + locale.getLangLabel('en')"
    >
      <div class="lang-toggle__rail" aria-hidden="true">
        <span class="lang-toggle__thumb"></span>
        <span class="lang-toggle__divider"></span>
      </div>
      <button
        type="button"
        class="lang-toggle__btn lang-toggle__btn--ar"
        [class.lang-toggle__btn--active]="locale.currentLang === 'ar'"
        [attr.aria-pressed]="locale.currentLang === 'ar'"
        [attr.aria-label]="locale.getLangLabel('ar')"
        (click)="setLang('ar')"
      >
        <span class="lang-toggle__glyph" aria-hidden="true">ع</span>
      </button>
      <button
        type="button"
        class="lang-toggle__btn lang-toggle__btn--en"
        [class.lang-toggle__btn--active]="locale.currentLang === 'en'"
        [attr.aria-pressed]="locale.currentLang === 'en'"
        [attr.aria-label]="locale.getLangLabel('en')"
        (click)="setLang('en')"
      >
        <span class="lang-toggle__glyph" aria-hidden="true">En</span>
      </button>
    </div>
  `,
  styles: [`
    :host {
      display: inline-flex;
    }

    .lang-toggle {
      position: relative;
      display: grid;
      grid-template-columns: 1fr 1fr;
      align-items: stretch;
      min-width: 92px;
      height: 40px;
      padding: 3px;
      border-radius: 14px;
      border: 1px solid color-mix(in srgb, var(--color-border) 85%, transparent);
      background: linear-gradient(
        165deg,
        #ffffff 0%,
        color-mix(in srgb, var(--color-bg-elevated) 92%, var(--color-primary-muted)) 100%
      );
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.95),
        inset 0 -2px 0 rgba(15, 23, 42, 0.05),
        0 1px 0 rgba(255, 255, 255, 0.55);
      transition:
        border-color 0.22s ease,
        box-shadow 0.22s ease,
        filter 0.22s ease;
    }

    .lang-toggle::after {
      content: '';
      position: absolute;
      inset: 1px;
      border-radius: 12px;
      pointer-events: none;
      background: linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.4) 0%,
        transparent 45%
      );
      opacity: 0.55;
    }

    .lang-toggle__rail {
      position: absolute;
      inset: 3px;
      z-index: 0;
      border-radius: 11px;
      pointer-events: none;
      overflow: hidden;
    }

    .lang-toggle__thumb {
      position: absolute;
      top: 0;
      bottom: 0;
      width: calc(50% - 1px);
      border-radius: 9px;
      background: linear-gradient(
        165deg,
        color-mix(in srgb, var(--color-primary) 12%, #ffffff) 0%,
        color-mix(in srgb, var(--color-primary) 22%, #f0fdf4) 100%
      );
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.85),
        inset 0 -1px 0 rgba(15, 61, 46, 0.08);
      inset-inline-start: 0;
      transition: inset-inline-start 0.32s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .lang-toggle--en .lang-toggle__thumb {
      inset-inline-start: calc(50% + 1px);
    }

    .lang-toggle__divider {
      position: absolute;
      top: 22%;
      bottom: 22%;
      inset-inline-start: 50%;
      width: 1px;
      transform: translateX(-50%);
      background: linear-gradient(
        180deg,
        transparent,
        color-mix(in srgb, var(--color-border) 70%, transparent),
        transparent
      );
      opacity: 0.85;
    }

    .lang-toggle__btn--ar {
      grid-column: 1;
      grid-row: 1;
    }

    .lang-toggle__btn--en {
      grid-column: 2;
      grid-row: 1;
    }

    .lang-toggle__btn {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0;
      padding: 0;
      border: none;
      background: transparent;
      cursor: pointer;
      font-family: inherit;
      transition: color 0.2s ease, transform 0.2s ease;
    }

    .lang-toggle__btn:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
      border-radius: 8px;
    }

    .lang-toggle__glyph {
      font-weight: 700;
      font-size: 0.95rem;
      line-height: 1;
      letter-spacing: 0.02em;
      color: var(--color-text-secondary);
      transition: color 0.2s ease, text-shadow 0.2s ease;
    }

    .lang-toggle__btn--en .lang-toggle__glyph {
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: none;
    }

    .lang-toggle__btn--active .lang-toggle__glyph {
      color: var(--color-primary);
      text-shadow: 0 1px 0 rgba(255, 255, 255, 0.35);
    }

    .lang-toggle__btn:not(.lang-toggle__btn--active) .lang-toggle__glyph {
      opacity: 0.55;
    }

    .lang-toggle__btn:hover:not(.lang-toggle__btn--active) .lang-toggle__glyph {
      opacity: 0.88;
      color: var(--color-text);
    }

    .lang-toggle:hover {
      border-color: color-mix(in srgb, var(--color-primary) 22%, var(--color-border-light));
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.98),
        inset 0 -2px 0 rgba(15, 23, 42, 0.06),
        0 2px 0 rgba(255, 255, 255, 0.45);
    }

    /* —— App header —— */
    :host-context(app-header) .lang-toggle {
      border-color: color-mix(in srgb, var(--color-header-border) 90%, transparent);
      background: linear-gradient(
        165deg,
        var(--color-bg-header) 0%,
        color-mix(in srgb, var(--color-bg-header) 88%, var(--color-primary-muted)) 100%
      );
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.9),
        inset 0 -2px 0 rgba(15, 61, 46, 0.04),
        0 1px 0 rgba(255, 255, 255, 0.5);
    }

    :host-context(app-header) .lang-toggle__thumb {
      background: linear-gradient(
        165deg,
        color-mix(in srgb, var(--color-primary) 18%, #ffffff) 0%,
        color-mix(in srgb, var(--color-primary) 28%, #ecfdf5) 100%
      );
    }

    :host-context(app-header) .lang-toggle__btn--active .lang-toggle__glyph {
      color: var(--color-primary);
    }

    :host-context(app-header) .lang-toggle:hover {
      border-color: color-mix(in srgb, var(--color-primary) 18%, var(--color-header-border));
    }

    /* —— Landing (Gulf) —— */
    :host-context(.landing) .lang-toggle {
      border: 1px solid rgba(214, 185, 122, 0.42);
      background: linear-gradient(
        165deg,
        color-mix(in srgb, var(--gulf-green-700) 82%, #143d32) 0%,
        var(--gulf-green-900) 42%,
        #061a14 100%
      );
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.14),
        inset 0 -3px 0 rgba(0, 0, 0, 0.32),
        inset 0 0 0 1px rgba(200, 164, 93, 0.1),
        0 0 0 1px rgba(10, 40, 32, 0.85);
      backdrop-filter: blur(10px);
    }

    :host-context(.landing) .lang-toggle::after {
      background: linear-gradient(
        155deg,
        rgba(214, 185, 122, 0.18) 0%,
        transparent 50%
      );
      opacity: 0.9;
    }

    :host-context(.landing) .lang-toggle__thumb {
      background: linear-gradient(
        165deg,
        rgba(214, 185, 122, 0.38) 0%,
        rgba(184, 146, 74, 0.22) 45%,
        rgba(12, 47, 37, 0.55) 100%
      );
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.28),
        inset 0 -2px 0 rgba(0, 0, 0, 0.25);
    }

    :host-context(.landing) .lang-toggle__divider {
      background: linear-gradient(
        180deg,
        transparent,
        rgba(200, 164, 93, 0.35),
        transparent
      );
    }

    :host-context(.landing) .lang-toggle__btn--active .lang-toggle__glyph {
      color: #fdfbf6;
      text-shadow:
        0 1px 0 rgba(0, 0, 0, 0.35),
        0 0 12px rgba(214, 185, 122, 0.35);
    }

    :host-context(.landing) .lang-toggle__btn:not(.lang-toggle__btn--active) .lang-toggle__glyph {
      color: rgba(248, 250, 248, 0.45);
      text-shadow: none;
    }

    :host-context(.landing) .lang-toggle__btn:hover:not(.lang-toggle__btn--active) .lang-toggle__glyph {
      color: rgba(240, 230, 210, 0.88);
    }

    :host-context(.landing) .lang-toggle:hover {
      border-color: rgba(214, 185, 122, 0.65);
      filter: brightness(1.04);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.2),
        inset 0 -3px 0 rgba(0, 0, 0, 0.3),
        inset 0 0 0 1px rgba(200, 164, 93, 0.18),
        0 0 18px rgba(200, 164, 93, 0.14);
    }

    :host-context(.landing) .lang-toggle__btn:focus-visible {
      outline-color: var(--gulf-gold-hover);
    }

    @media (prefers-reduced-motion: reduce) {
      .lang-toggle__thumb {
        transition: none;
      }
    }
  `],
})
export class LanguageSwitcherComponent {
  readonly locale = inject(LocaleService);

  setLang(lang: string): void {
    this.locale.setLang(lang);
  }
}
