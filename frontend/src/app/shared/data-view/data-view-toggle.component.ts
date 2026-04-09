import { Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TooltipDirective } from '../tooltip/tooltip.directive';
import { DataViewPreferenceService } from './data-view-preference.service';

@Component({
  selector: 'app-data-view-toggle',
  standalone: true,
  imports: [TranslateModule, TooltipDirective],
  template: `
    <div class="data-view-toggle" role="group" [attr.aria-label]="'common.dataViewGroup' | translate">
      <button
        type="button"
        class="data-view-toggle__btn"
        [class.data-view-toggle__btn--active]="pref.mode() === 'table'"
        (click)="pref.setMode('table')"
        [appTooltip]="'common.viewTable' | translate"
        tooltipPlacement="top"
      >
        <span class="data-view-toggle__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3.5" y="4.5" width="7" height="6" rx="1.2" />
            <rect x="13.5" y="4.5" width="7" height="6" rx="1.2" />
            <rect x="3.5" y="13.5" width="7" height="6" rx="1.2" />
            <rect x="13.5" y="13.5" width="7" height="6" rx="1.2" />
          </svg>
        </span>
        <span class="data-view-toggle__label">{{ 'common.viewTable' | translate }}</span>
      </button>
      <button
        type="button"
        class="data-view-toggle__btn"
        [class.data-view-toggle__btn--active]="pref.mode() === 'cards'"
        (click)="pref.setMode('cards')"
        [appTooltip]="'common.viewCards' | translate"
        tooltipPlacement="top"
      >
        <span class="data-view-toggle__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="4" y="4.5" width="16" height="5.5" rx="1.2" />
            <rect x="4" y="12.5" width="10" height="7" rx="1.2" />
            <rect x="15.5" y="12.5" width="4.5" height="7" rx="1.2" />
          </svg>
        </span>
        <span class="data-view-toggle__label">{{ 'common.viewCards' | translate }}</span>
      </button>
    </div>
  `,
  styleUrl: './data-view-toggle.component.scss',
})
export class DataViewToggleComponent {
  readonly pref = inject(DataViewPreferenceService);
}
