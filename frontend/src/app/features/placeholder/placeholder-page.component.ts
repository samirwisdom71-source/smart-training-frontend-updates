import { Component, inject, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent, BreadcrumbItem } from '../../shared/page-shell/page-shell.component';

@Component({
  selector: 'app-placeholder-page',
  standalone: true,
  imports: [TranslateModule, PageShellComponent],
  template: `
    <app-page-shell [title]="titleLabel()" [breadcrumbs]="breadcrumbs()">
      <div class="placeholder-content">
        <p class="placeholder-content__text">{{ 'placeholder.message' | translate }}</p>
        <p class="placeholder-content__hint">{{ 'placeholder.hint' | translate }}</p>
      </div>
    </app-page-shell>
  `,
  styles: [`
    .placeholder-content { padding: var(--space-2xl) 0; text-align: center; }
    .placeholder-content__text { font-size: var(--text-body); color: var(--color-text-secondary); margin: 0 0 var(--space-sm); }
    .placeholder-content__hint { font-size: var(--text-body-sm); color: var(--color-text-muted); margin: 0; }
  `]
})
export class PlaceholderPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);

  private titleKey = computed(() => this.route.snapshot.data['titleKey'] as string ?? 'nav.dashboard');
  titleLabel = computed(() => this.translate.instant(this.titleKey()));
  breadcrumbs = computed((): BreadcrumbItem[] => {
    const key = this.route.snapshot.data['breadcrumbKey'] as string | undefined;
    return key ? [{ label: this.translate.instant(key) }] : [];
  });
}
