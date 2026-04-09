import { Component, input, output, booleanAttribute } from '@angular/core';
import { TooltipDirective } from '../tooltip/tooltip.directive';

export type LuxActionKind =
  | 'edit'
  | 'delete'
  | 'view'
  | 'link'
  | 'document'
  | 'user'
  | 'restore'
  | 'settings'
  | 'toggle';

@Component({
  selector: 'app-lux-action-icon',
  standalone: true,
  imports: [TooltipDirective],
  template: `
    <button
      type="button"
      class="lux-dc-action"
      [class.lux-dc-action--danger]="danger()"
      [class.lux-dc-action--on]="activeHighlight()"
      [disabled]="disabled()"
      (click)="activate.emit()"
      [attr.aria-label]="label()"
      [appTooltip]="label()"
      tooltipPlacement="top"
    >
      <span class="lux-dc-action__glyph" aria-hidden="true">
        @switch (kind()) {
          @case ('edit') {
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M12 20h9M16.5 3.5l4 4L8 20H4v-4L16.5 3.5z"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          }
          @case ('delete') {
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M10 11v6M14 11v6M6 7l1 14h10l1-14"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          }
          @case ('view') {
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linejoin="round"
              />
              <circle cx="12" cy="12" r="2.5" stroke="currentColor" stroke-width="1.6" />
            </svg>
          }
          @case ('link') {
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M14 4h6v6M10 14 20 4M6 8l10 10"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          }
          @case ('document') {
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M8 4h8l4 4v13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linejoin="round"
              />
              <path d="M12 8h4M12 12h4M12 16h2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
            </svg>
          }
          @case ('user') {
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8.5" r="3.2" stroke="currentColor" stroke-width="1.6" />
              <path
                d="M5.5 20c.8-3.2 3.6-5 6.5-5s5.7 1.8 6.5 5"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
              />
            </svg>
          }
          @case ('restore') {
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M4.5 10.5A7.5 7.5 0 0 1 19.5 12M19.5 12l-3-3m3 3-3 3M19.5 13.5a7.5 7.5 0 0 1-15 0"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          }
          @case ('settings') {
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6" />
              <path
                d="M12 2v2M12 20v2M2 12h2M20 12h2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M19.8 4.2l-1.4 1.4M5.6 18.4l-1.4 1.4"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
          }
          @case ('toggle') {
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M8 7h8a5 5 0 0 1 0 10H8a5 5 0 0 1 0-10Z"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linejoin="round"
              />
              <circle cx="15" cy="12" r="2.3" fill="currentColor" />
            </svg>
          }
        }
      </span>
    </button>
  `,
  styleUrl: './lux-action-icon.component.scss',
})
export class LuxActionIconComponent {
  kind = input.required<LuxActionKind>();
  label = input.required<string>();
  disabled = input(false, { transform: booleanAttribute });
  danger = input(false, { transform: booleanAttribute });
  /** e.g. active / on state for `toggle` actions */
  activeHighlight = input(false, { transform: booleanAttribute });
  activate = output<void>();
}
