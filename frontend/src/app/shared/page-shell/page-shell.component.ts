import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

export interface BreadcrumbItem {
  label: string;
  route?: string;
}

@Component({
  selector: 'app-page-shell',
  standalone: true,
  imports: [ TranslateModule],
  template: `
    <div class="page-shell" [class.page-shell--full-width]="fullWidth()">
      @if (showPageTitle()) {
        <header class="page-shell__header">
          <h1 class="page-shell__title">{{ title() }}</h1>
        </header>
      }
      <div class="page-shell__content">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .page-shell { padding: var(--space-lg); max-width: var(--content-max-width); margin: 0 auto; }
    .page-shell.page-shell--full-width {
      max-width: none;
      width: 100%;
      margin: 0;
      padding: var(--space-sm) 0 var(--space-xl);
    }
    .page-shell__header { margin-bottom: var(--space-md); }
    .page-shell__title {
      margin: 0;
      font-size: var(--text-display-2);
      font-weight: 600;
      color: var(--color-text);
      letter-spacing: -0.02em;
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
}
