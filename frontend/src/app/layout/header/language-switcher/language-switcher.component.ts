import { Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { LocaleService } from '../../../core/i18n/locale.service';
import { TooltipDirective } from '../../../shared/tooltip/tooltip.directive';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [TranslateModule, TooltipDirective],
  template: `
    <button
      type="button"
      class="lang-btn"
      [attr.aria-label]="'header.language' | translate"
      [attr.title]="locale.getLangLabel(locale.currentLang) + ' → ' + locale.getLangLabel(otherLang())"
      [appTooltip]="locale.getLangLabel(locale.currentLang) + ' → ' + locale.getLangLabel(otherLang())"
      (click)="switchLang()"
    >
      <svg class="lang-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3a10.2 10.2 0 0 1 3 9 10.2 10.2 0 0 1-3 9 10.2 10.2 0 0 1-3-9 10.2 10.2 0 0 1 3-9z" />
      </svg>
    </button>
  `,
  styles: [`
    .lang-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border: none;
      background: transparent;
      border-radius: var(--radius-md);
      color: var(--color-text-secondary);
      cursor: pointer;
    }
    .lang-icon {
      width: 22px;
      height: 22px;
      color: var(--color-primary);
    }
    .lang-btn:hover { background: var(--color-bg-hover); color: var(--color-text); }
    :host-context(app-header) .lang-btn {
      color: var(--color-header-text-muted);
    }
    :host-context(app-header) .lang-btn:hover {
      background: var(--color-header-hover);
      color: var(--color-header-text);
    }
    :host-context(app-header) .lang-icon { color: var(--color-primary); }
  `],
})
export class LanguageSwitcherComponent {
  readonly locale = inject(LocaleService);

  /** The other locale (the one we'll switch to on click). */
  otherLang(): string {
    const list = this.locale.supportedLocales;
    const current = this.locale.currentLang;
    const other = list.find(c => c !== current);
    return other ?? list[0];
  }

  switchLang(): void {
    this.locale.setLang(this.otherLang());
  }
}
