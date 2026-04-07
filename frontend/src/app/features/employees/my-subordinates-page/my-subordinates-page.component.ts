import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { EmployeesApiService } from '../../../core/api/employees/employees-api.service';
import type { EmployeeListDto } from '../../../core/api/employees/employees-api.models';

@Component({
  selector: 'app-my-subordinates-page',
  standalone: true,
  imports: [TranslateModule, PageShellComponent],
  template: `
    <app-page-shell
      [title]="'nav.mySubordinates' | translate"
      [breadcrumbs]="breadcrumbs()"
      [fullWidth]="true"
      [showPageTitle]="false"
    >
      <div class="ent-admin-page ent-page-fade-in">
        <header class="ent-admin-hero">
          <div class="ent-admin-hero__inner">
            <h1 class="ent-admin-hero__title">{{ 'nav.mySubordinates' | translate }}</h1>
            <p class="ent-admin-hero__subtitle">{{ 'enterprise.adminHeroSubtitle' | translate }}</p>
          </div>
        </header>

        <div class="ent-admin-content">
          @if (loading()) {
            <div class="ent-table-panel">
              <div class="table-loading">
                <div class="ds-skeleton" style="height: 48px; margin-bottom: 8px;"></div>
                <div class="ds-skeleton" style="height: 48px; margin-bottom: 8px;"></div>
                <div class="ds-skeleton" style="height: 48px;"></div>
              </div>
            </div>
          } @else if (error()) {
            <div class="ds-error-state">
              <p class="ds-error-state__title">{{ error() }}</p>
              <button type="button" class="ds-btn ds-btn--secondary ds-btn--sm" (click)="load()">{{ 'empty.tryAgain' | translate }}</button>
            </div>
          } @else if (!items().length) {
            <div class="ent-table-panel">
              <div class="ds-empty">
                <p class="ds-empty__title">{{ 'mySubordinates.empty' | translate }}</p>
              </div>
            </div>
          } @else {
            <div class="ent-table-panel">
              <div class="ds-table-wrap">
                <table class="ds-table">
                  <thead>
                    <tr>
                      <th>{{ 'table.employeeNumber' | translate }}</th>
                      <th>{{ 'table.name' | translate }}</th>
                      <th>{{ 'table.email' | translate }}</th>
                      <th>{{ 'table.status' | translate }}</th>
                      <th>{{ 'table.jobTitle' | translate }}</th>
                      <th>{{ 'table.organizationalUnit' | translate }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (e of items(); track e.id) {
                      <tr>
                        <td>{{ e.employeeNumber }}</td>
                        <td>{{ getEmployeeDisplayName(e) }}</td>
                        <td>{{ e.email ?? '—' }}</td>
                        <td><span class="ds-badge" [class.ds-badge--success]="e.status === 'Active'" [class.ds-badge--neutral]="e.status !== 'Active'">{{ e.status }}</span></td>
                        <td>{{ e.jobTitleEn ?? '—' }}</td>
                        <td>{{ getLocalizedText(e.organizationalUnitNameAr, e.organizationalUnitNameEn) }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }
        </div>
      </div>
    </app-page-shell>
  `,
  styles: [`
    .table-loading { padding: var(--space-md) var(--space-lg); }
  `]
})
export class MySubordinatesPageComponent implements OnInit {
  private readonly api = inject(EmployeesApiService);
  private readonly translate = inject(TranslateService);

  readonly items = signal<EmployeeListDto[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  breadcrumbs = computed(() => [{ label: this.translate.instant('nav.settings') }, { label: this.translate.instant('nav.mySubordinates') }]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getMySubordinates().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) this.items.set(res.data);
        else this.error.set(res.message ?? 'Failed to load');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? err.message ?? 'Failed to load');
      }
    });
  }

  getEmployeeDisplayName(e: EmployeeListDto): string {
    return e.fullNameEn || e.fullNameAr || e.employeeNumber || '—';
  }

  getLocalizedText(ar?: string | null, en?: string | null): string {
    const currentLang = (this.translate.currentLang || this.translate.getDefaultLang() || 'en').toLowerCase();
    const prefersArabic = currentLang.startsWith('ar');
    const arText = ar?.trim() ?? '';
    const enText = en?.trim() ?? '';
    if (prefersArabic) return arText || enText || '—';
    return enText || arText || '—';
  }
}
