import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { NgForOf } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { filter } from 'rxjs/operators';

interface CompetencyTab {
  path: string;
  labelKey: string;
}

@Component({
  selector: 'app-competency-shell-page',
  standalone: true,
  imports: [RouterOutlet, RouterLink, NgForOf, TranslateModule, PageShellComponent],
  template: `
    <app-page-shell
      [title]="'nav.competency' | translate"
      [breadcrumbs]="[{ label: ('nav.competency' | translate) }]"
    >
      <div class="tabs-wrap" role="tablist" [attr.aria-label]="'nav.competency' | translate">
        <button
          *ngFor="let tab of tabs; let i = index"
          type="button"
          role="tab"
          class="tab-btn"
          [class.active]="activeIndex === i"
          [attr.aria-selected]="activeIndex === i"
          (click)="navigateTo(i)"
        >
          {{ tab.labelKey | translate }}
        </button>
      </div>

      <router-outlet></router-outlet>

      <div class="wizard-nav">
        <button
          type="button"
          class="ds-btn ds-btn--ghost"
          (click)="goPrev()"
          [disabled]="activeIndex === 0"
        >
          {{ 'common.previous' | translate }}
        </button>
        <button
          type="button"
          class="ds-btn ds-btn--primary"
          (click)="goNext()"
          [disabled]="activeIndex === tabs.length - 1"
        >
          {{ 'common.next' | translate }}
        </button>
      </div>
    </app-page-shell>
  `,
  styles: [`
    .tabs-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: var(--space-lg);
      padding: 8px;
      border: 1px solid var(--color-border-light);
      border-radius: var(--radius-lg);
      background: var(--color-bg-subtle);
    }

    .tab-btn {
      border: 1px solid transparent;
      background: transparent;
      color: var(--color-text-secondary);
      border-radius: 999px;
      padding: 10px 14px;
      font-size: var(--text-body-sm);
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .tab-btn:hover {
      background: var(--color-bg-hover);
      color: var(--color-text);
    }

    .tab-btn.active {
      background: var(--color-primary);
      color: var(--color-primary-contrast, #fff);
      border-color: var(--color-primary);
      box-shadow: var(--shadow-sm);
    }

    .wizard-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: var(--space-lg);
      gap: var(--space-sm);
    }
  `]
})
export class CompetencyShellPageComponent {
  readonly tabs: CompetencyTab[] = [
    { path: 'frameworks', labelKey: 'nav.competencyFrameworks' },
    { path: 'types', labelKey: 'nav.competencyTypes' },
    { path: 'competencies', labelKey: 'nav.competencies' },
    { path: 'proficiency-levels', labelKey: 'nav.proficiencyLevels' },
    { path: 'job-mappings', labelKey: 'nav.jobCompetencyMappings' }
  ];

  activeIndex = 0;

  constructor(
    private readonly router: Router
  ) {
    this.setActiveFromUrl(this.router.url);
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.setActiveFromUrl(this.router.url));
  }

  private setActiveFromUrl(url: string): void {
    const parts = url.split('/').filter(Boolean);
    const segmentAfterCompetency = parts[parts.indexOf('competency') + 1];
    const idx = this.tabs.findIndex(t => t.path === segmentAfterCompetency);
    if (idx >= 0) this.activeIndex = idx;
  }

  navigateTo(index: number): void {
    const target = this.tabs[index];
    if (!target) return;
    const base = ['/competency', target.path];
    this.router.navigate(base);
  }

  goPrev(): void {
    if (this.activeIndex > 0) {
      this.navigateTo(this.activeIndex - 1);
    }
  }

  goNext(): void {
    if (this.activeIndex < this.tabs.length - 1) {
      this.navigateTo(this.activeIndex + 1);
    }
  }
}

