import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
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
  imports: [RouterOutlet, NgForOf, TranslateModule, PageShellComponent, RouterLink, RouterLinkActive],
  templateUrl: './competency-shell-page.component.html',
  styleUrls: ['./competency-shell-page.component.scss']
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

