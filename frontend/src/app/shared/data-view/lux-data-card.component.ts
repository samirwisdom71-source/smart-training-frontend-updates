import { Component, input, booleanAttribute, ViewEncapsulation } from '@angular/core';

/**
 * Presentational shell for card-style list rows: full rounded border, hover lift — no box-shadow.
 * Project default slot = body; use <ng-container luxCardActions> for icon actions.
 */
@Component({
  selector: 'app-lux-data-card',
  standalone: true,
  template: `
    <section
      class="lux-dc-card"
      [class.lux-dc-card--interactive]="interactive()"
      [attr.aria-label]="ariaLabel() ?? null"
    >
      <div class="lux-dc-card__inner">
        <ng-content select="[luxCardHeader]" />
        @if (title() || subtitle()) {
          <header class="lux-dc-card__head">
            @if (title()) {
              <h3 class="lux-dc-card__title">{{ title() }}</h3>
            }
            @if (subtitle()) {
              <p class="lux-dc-card__subtitle">{{ subtitle() }}</p>
            }
          </header>
        }
        <div class="lux-dc-card__body">
          <ng-content />
        </div>
        <footer class="lux-dc-card__actions">
          <ng-content select="[luxCardActions]" />
        </footer>
      </div>
    </section>
  `,
  styleUrl: './lux-data-card.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class LuxDataCardComponent {
  title = input<string>();
  subtitle = input<string>();
  /** When true, whole card gets cursor + keyboard-focus ring on inner links. */
  interactive = input(false, { transform: booleanAttribute });
  ariaLabel = input<string | undefined>();
}
