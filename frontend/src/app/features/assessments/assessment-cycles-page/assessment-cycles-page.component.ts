import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { TooltipDirective } from '../../../shared/tooltip/tooltip.directive';
import { AssessmentsApiService } from '../../../core/api/assessments/assessments-api.service';
import type { AssessmentCycleListDto, AssessmentCycleDto, CreateAssessmentCycleRequest, UpdateAssessmentCycleRequest, AssessmentCycleScopeSummaryDto, AssessmentGenerationResultDto } from '../../../core/api/assessments/assessments-api.models';
import type { PagedResult } from '../../../core/models/api-response';
import { OrganizationsApiService } from '../../../core/api/organizations/organizations-api.service';
import type { OrganizationListDto } from '../../../core/api/organizations/organizations-api.models';
import { OrganizationalUnitsApiService } from '../../../core/api/organizational-units/organizational-units-api.service';
import type { OrganizationalUnitListDto } from '../../../core/api/organizational-units/organizational-units-api.models';
import { JobsApiService } from '../../../core/api/jobs/jobs-api.service';
import type { JobListDto } from '../../../core/api/jobs/jobs-api.models';
import { EmployeesApiService } from '../../../core/api/employees/employees-api.service';
import type { EmployeeListDto } from '../../../core/api/employees/employees-api.models';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionCodes } from '../../../core/auth/permissions';
import { ToastService } from '../../../core/toast/toast.service';

@Component({
  selector: 'app-assessment-cycles-page',
  standalone: true,
  imports: [FormsModule, TranslateModule, PageShellComponent, DatePipe, TooltipDirective],
  template: `
    <app-page-shell [title]="'assessments.cyclesTitle' | translate" [breadcrumbs]="breadcrumbs()">
      <div class="actions-row" actions>
        @if (canCreate()) {
          <button
            type="button"
            class="ds-btn ds-btn--primary ds-btn--sm"
            (click)="openCreate()"
            [appTooltip]="'common.add' | translate"
          >
            {{ 'common.add' | translate }}
          </button>
        }
      </div>
      <div filters>
        <div class="ds-filterbar">
          <div class="ds-filterbar__controls">
            <div class="ds-filterfield">
              <div class="ds-filterfield__label">{{ 'common.search' | translate }}</div>
              <input type="text" class="ds-input filter-search ds-filterfield__control" [(ngModel)]="search" (ngModelChange)="onSearchChange()" />
            </div>
            <div class="ds-filterfield">
              <div class="ds-filterfield__label">{{ 'table.organization' | translate }}</div>
              <select class="ds-input filter-select ds-filterfield__control" [(ngModel)]="organizationIdFilter" (ngModelChange)="onFilterChange()">
                <option [ngValue]="null">{{ 'common.all' | translate }}</option>
                @for (org of orgOptions(); track org.id) {
                  <option [ngValue]="org.id">{{ getLocalizedText(org.nameAr, org.nameEn) }}</option>
                }
              </select>
            </div>
            <div class="ds-filterfield">
              <div class="ds-filterfield__label">{{ 'table.status' | translate }}</div>
              <select class="ds-input filter-select ds-filterfield__control" [(ngModel)]="statusFilter" (ngModelChange)="onFilterChange()">
                <option [ngValue]="null">{{ 'common.all' | translate }}</option>
                <option value="Draft">{{ 'assessments.draft' | translate }}</option>
                <option value="Open">{{ 'assessments.open' | translate }}</option>
                <option value="Closed">{{ 'assessments.closed' | translate }}</option>
                <option value="Archived">{{ 'assessments.archived' | translate }}</option>
              </select>
            </div>
          </div>
          <div class="ds-filterbar__actions">
            <button type="button" class="ds-btn ds-btn--secondary ds-btn--sm" (click)="clearFilters()">
              {{ 'common.clearFilters' | translate }}
            </button>
          </div>
        </div>
      </div>

      @if (loading()) {
        <div class="table-loading">
          <div class="ds-skeleton" style="height: 48px; margin-bottom: 8px;"></div>
          <div class="ds-skeleton" style="height: 48px; margin-bottom: 8px;"></div>
          <div class="ds-skeleton" style="height: 48px;"></div>
        </div>
      } @else if (error()) {
        <div class="ds-error-state">
          <p class="ds-error-state__title">{{ error() }}</p>
          <button type="button" class="ds-btn ds-btn--secondary ds-btn--sm" (click)="load()">{{ 'empty.tryAgain' | translate }}</button>
        </div>
      } @else if (!data()?.items?.length) {
        <div class="ds-empty">
          <p class="ds-empty__title">{{ 'table.noRows' | translate }}</p>
          @if (canCreate()) {
            <button type="button" class="ds-btn ds-btn--primary ds-btn--sm" (click)="openCreate()">{{ 'common.add' | translate }}</button>
          }
        </div>
      } @else {
        <div class="ds-table-wrap">
          <table class="ds-table">
            <thead>
              <tr>
                <th scope="col">{{ 'table.code' | translate }}</th>
                <th scope="col">{{ 'table.name' | translate }}</th>
                <th scope="col">{{ 'table.organization' | translate }}</th>
                <th scope="col">{{ 'assessments.startDate' | translate }}</th>
                <th scope="col">{{ 'assessments.endDate' | translate }}</th>
                <th scope="col">{{ 'assessments.status' | translate }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (c of data()!.items; track c.id) {
                <tr>
                  <td>{{ c.code }}</td>
                  <td>{{ getLocalizedText(c.nameAr, c.nameEn) }}</td>
                  <td>{{ getLocalizedOrgName(c.organizationId, c.organizationNameEn) }}</td>
                  <td>{{ c.startDate | date }}</td>
                  <td>{{ c.endDate | date }}</td>
                  <td>
                    <span class="ds-badge"
                      [class.ds-badge--info]="c.status === 'Draft'"
                      [class.ds-badge--success]="c.status === 'Open'"
                      [class.ds-badge--neutral]="c.status === 'Closed' || c.status === 'Archived'">
                      {{ ('assessments.' + c.status.toLowerCase()) | translate }}
                    </span>
                  </td>
                  <td class="cell-actions">
                    @if (canEdit() && (c.status === 'Draft' || c.status === 'Open')) {
                      <button
                        type="button"
                        class="ds-btn ds-btn--ghost ds-btn--icon"
                        (click)="openScopeDrawer(c)"
                        [attr.aria-label]="'assessments.scopeAndGenerate' | translate"
                        [appTooltip]="'assessments.scopeAndGenerate' | translate"
                      >
                        📌
                      </button>
                    }
                    @if (canEdit()) {
                      <button
                        type="button"
                        class="ds-btn ds-btn--ghost ds-btn--icon"
                        (click)="openEdit(c)"
                        [attr.aria-label]="'common.edit' | translate"
                        [appTooltip]="'common.edit' | translate"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        class="ds-btn ds-btn--ghost ds-btn--icon"
                        (click)="changeStatus(c, 'Open')"
                        [disabled]="c.status === 'Open'"
                        [attr.aria-label]="'assessments.open' | translate"
                        [appTooltip]="'assessments.open' | translate"
                      >
                        ▶
                      </button>
                      <button
                        type="button"
                        class="ds-btn ds-btn--ghost ds-btn--icon"
                        (click)="changeStatus(c, 'Closed')"
                        [disabled]="c.status === 'Closed' || c.status === 'Draft'"
                        [attr.aria-label]="'assessments.closed' | translate"
                        [title]="c.status === 'Draft' ? ('assessments.closeFromOpenOnly' | translate) : ('assessments.closed' | translate)"
                        [appTooltip]="c.status === 'Draft' ? ('assessments.closeFromOpenOnly' | translate) : ('assessments.closed' | translate)"
                      >
                        ⏸
                      </button>
                      <button
                        type="button"
                        class="ds-btn ds-btn--ghost ds-btn--icon"
                        (click)="changeStatus(c, 'Archived')"
                        [disabled]="c.status === 'Archived'"
                        [attr.aria-label]="'assessments.archived' | translate"
                        [appTooltip]="'assessments.archived' | translate"
                      >
                        📦
                      </button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="pagination">
          <button type="button" class="ds-btn ds-btn--ghost ds-btn--sm" [disabled]="!data()?.hasPreviousPage" (click)="prevPage()">{{ 'common.previous' | translate }}</button>
          <span class="pagination-info">{{ 'common.page' | translate }} {{ page() }} {{ 'common.of' | translate }} {{ data()?.totalPages ?? 1 }}</span>
          <button type="button" class="ds-btn ds-btn--ghost ds-btn--sm" [disabled]="!data()?.hasNextPage" (click)="nextPage()">{{ 'common.next' | translate }}</button>
        </div>
      }
    </app-page-shell>

    @if (showModal()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal-drawer ds-card" (click)="$event.stopPropagation()">
          <h3 class="modal-drawer__title">
            {{ editingId() ? ('common.edit' | translate) : ('common.add' | translate) }} {{ 'assessments.cyclesTitle' | translate }}
          </h3>
          @if (modalError()) {
            <p class="ds-field-error">{{ modalError() }}</p>
          }
          <form (ngSubmit)="save()">
            <div class="form-group">
              <label class="ds-label">{{ 'table.code' | translate }}</label>
              <input type="text" class="ds-input" [(ngModel)]="form.code" name="code" />
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'table.nameEn' | translate }}</label>
              <input type="text" class="ds-input" [(ngModel)]="form.nameEn" name="nameEn" />
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'table.nameAr' | translate }}</label>
              <input type="text" class="ds-input" [(ngModel)]="form.nameAr" name="nameAr" />
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'table.descriptionEn' | translate }}</label>
              <textarea class="ds-textarea" [(ngModel)]="form.descriptionEn" name="descriptionEn" rows="2"></textarea>
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'table.descriptionAr' | translate }}</label>
              <textarea class="ds-textarea" [(ngModel)]="form.descriptionAr" name="descriptionAr" rows="2"></textarea>
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'table.organization' | translate }}</label>
              <select class="ds-input" [(ngModel)]="form.organizationId" name="organizationId">
                <option [ngValue]="''">—</option>
                @for (org of orgOptions(); track org.id) {
                  <option [ngValue]="org.id">{{ getLocalizedText(org.nameAr, org.nameEn) }} ({{ org.code }})</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'assessments.startDate' | translate }}</label>
              <input
                type="date"
                class="ds-input"
                [(ngModel)]="form.startDate"
                name="startDate"
                [max]="form.endDate || null"
                (change)="onCycleStartDateChange()"
              />
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'assessments.endDate' | translate }}</label>
              <input
                type="date"
                class="ds-input"
                [(ngModel)]="form.endDate"
                name="endDate"
                [min]="form.startDate || null"
                (change)="onCycleEndDateChange()"
              />
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'table.notes' | translate }}</label>
              <textarea class="ds-textarea" [(ngModel)]="form.notes" name="notes" rows="2"></textarea>
            </div>
            <div class="modal-drawer__actions">
              <button type="button" class="ds-btn ds-btn--secondary" (click)="closeModal()">{{ 'common.cancel' | translate }}</button>
              <button type="submit" class="ds-btn ds-btn--primary" [disabled]="saving()">
                {{ saving() ? ('common.loading' | translate) : ('common.save' | translate) }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    @if (scopeDrawerCycle()) {
      <div class="modal-overlay" (click)="closeScopeDrawer()">
        <div class="scope-drawer ds-card" (click)="$event.stopPropagation()">
          <h3 class="modal-drawer__title">{{ 'assessments.scopeAndGenerate' | translate }} — {{ getLocalizedText(scopeDrawerCycle()!.nameAr, scopeDrawerCycle()!.nameEn) }}</h3>
          @if (scopeError()) {
            <p class="ds-field-error">{{ scopeError() }}</p>
          }
          @if (scopeLoading()) {
            <p class="scope-loading">{{ 'common.loading' | translate }}</p>
          } @else if (scopeData()) {
            <section class="scope-section">
              <h4 class="scope-section__title">{{ 'assessments.scopeOUs' | translate }}</h4>
              <div class="scope-list">
                @for (ou of scopeData()!.organizationalUnits; track ou.id) {
                  <div class="scope-list-item">
                    <span>{{ ou.nameEn }}</span>
                    <button type="button" class="ds-btn ds-btn--ghost ds-btn--xs" (click)="removeScopeOu(ou.organizationalUnitId)">{{ 'common.delete' | translate }}</button>
                  </div>
                }
                @if (!scopeData()!.organizationalUnits.length) {
                  <p class="scope-empty">{{ 'common.noData' | translate }}</p>
                }
              </div>
              <div class="scope-add">
                <div class="scope-checklist">
                  <label class="scope-check-item scope-check-item--all">
                    <input
                      type="checkbox"
                      [checked]="areAllSelectableOusSelected()"
                      (change)="toggleSelectAllOus($any($event.target).checked)"
                      [disabled]="!ouOptions().length"
                    />
                    <span>{{ 'common.selectAll' | translate }}</span>
                  </label>
                  @for (ou of ouOptions(); track ou.id) {
                    <label class="scope-check-item" [class.scope-check-item--disabled]="isOuAlreadyInScope(ou.id)">
                      <input
                        type="checkbox"
                        [checked]="selectedOuIds.includes(ou.id)"
                        (change)="toggleOuSelection(ou.id, $any($event.target).checked)"
                        [disabled]="isOuAlreadyInScope(ou.id)"
                      />
                      <span>{{ ouOptionLabel(ou) }}</span>
                    </label>
                  }
                  @if (!ouOptions().length) {
                    <p class="scope-empty">{{ 'common.noData' | translate }}</p>
                  }
                </div>
                <div class="scope-add-actions">
                  <button type="button" class="ds-btn ds-btn--secondary ds-btn--sm" (click)="addSelectedOus()" [disabled]="!selectedOuIds.length">
                    {{ 'common.add' | translate }}
                  </button>
                </div>
              </div>
            </section>
            <section class="scope-section">
              <h4 class="scope-section__title">{{ 'assessments.scopeJobs' | translate }}</h4>
              <div class="scope-list">
                @for (job of scopeData()!.jobs; track job.id) {
                  <div class="scope-list-item">
                    <span>{{ job.code }} — {{ job.titleEn }}</span>
                    <button type="button" class="ds-btn ds-btn--ghost ds-btn--xs" (click)="removeScopeJob(job.jobId)">{{ 'common.delete' | translate }}</button>
                  </div>
                }
                @if (!scopeData()!.jobs.length) {
                  <p class="scope-empty">{{ 'common.noData' | translate }}</p>
                }
              </div>
              <div class="scope-add">
                <div class="scope-checklist">
                  <label class="scope-check-item scope-check-item--all">
                    <input
                      type="checkbox"
                      [checked]="areAllSelectableJobsSelected()"
                      (change)="toggleSelectAllJobs($any($event.target).checked)"
                      [disabled]="!jobOptions().length"
                    />
                    <span>{{ 'common.selectAll' | translate }}</span>
                  </label>
                  @for (job of jobOptions(); track job.id) {
                    <label class="scope-check-item">
                      <input
                        type="checkbox"
                        [checked]="selectedJobIds.includes(job.id)"
                        (change)="toggleJobSelection(job.id, $any($event.target).checked)"
                      />
                      <span>{{ job.code }} — {{ job.titleEn }}</span>
                    </label>
                  }
                  @if (!jobOptions().length) {
                    <p class="scope-empty">{{ 'common.noData' | translate }}</p>
                  }
                </div>
                <div class="scope-add-actions">
                  <button type="button" class="ds-btn ds-btn--secondary ds-btn--sm" (click)="addSelectedJobs()" [disabled]="!selectedJobIds.length">
                    {{ 'common.add' | translate }}
                  </button>
                </div>
              </div>
            </section>
            <section class="scope-section">
              <h4 class="scope-section__title">{{ 'assessments.scopeEmployees' | translate }}</h4>
              <div class="scope-list">
                @for (emp of scopeData()!.employees; track emp.id) {
                  <div class="scope-list-item">
                    <span>{{ emp.employeeNumber }} — {{ emp.fullNameEn }}</span>
                    <button type="button" class="ds-btn ds-btn--ghost ds-btn--xs" (click)="removeScopeEmployee(emp.employeeId)">{{ 'common.delete' | translate }}</button>
                  </div>
                }
                @if (!scopeData()!.employees.length) {
                  <p class="scope-empty">{{ 'common.noData' | translate }}</p>
                }
              </div>
              <div class="scope-add">
                <div class="scope-checklist">
                  <label class="scope-check-item scope-check-item--all">
                    <input
                      type="checkbox"
                      [checked]="areAllSelectableEmployeesSelected()"
                      (change)="toggleSelectAllEmployees($any($event.target).checked)"
                      [disabled]="!employeeOptions().length"
                    />
                    <span>{{ 'common.selectAll' | translate }}</span>
                  </label>
                  @for (emp of employeeOptions(); track emp.id) {
                    <label class="scope-check-item">
                      <input
                        type="checkbox"
                        [checked]="selectedEmployeeIds.includes(emp.id)"
                        (change)="toggleEmployeeSelection(emp.id, $any($event.target).checked)"
                      />
                      <span>{{ emp.employeeNumber }} — {{ emp.fullNameEn }}</span>
                    </label>
                  }
                  @if (!employeeOptions().length) {
                    <p class="scope-empty">{{ 'common.noData' | translate }}</p>
                  }
                </div>
                <div class="scope-add-actions">
                  <button type="button" class="ds-btn ds-btn--secondary ds-btn--sm" (click)="addSelectedEmployees()" [disabled]="!selectedEmployeeIds.length">
                    {{ 'common.add' | translate }}
                  </button>
                </div>
              </div>
            </section>
            @if (generationResult()) {
              <div class="scope-result ds-card scope-result--success">
                <p><strong>{{ 'assessments.generationResult' | translate }}</strong></p>
                <p>{{ 'assessments.totalInScope' | translate }}: {{ generationResult()!.totalEmployeesInScope }}</p>
                <p>{{ 'assessments.assessmentsGenerated' | translate }}: {{ generationResult()!.assessmentsGenerated }}</p>
                <p>{{ 'assessments.skippedExisting' | translate }}: {{ generationResult()!.skippedExisting }}</p>
                <p>{{ 'assessments.skippedNoJobOrMappings' | translate }}: {{ generationResult()!.skippedNoJobOrNoMappings }}</p>
                <p>{{ 'assessments.detailRowsCreated' | translate }}: {{ generationResult()!.detailRowsCreated }}</p>
              </div>
            }
            <div class="modal-drawer__actions">
              <button type="button" class="ds-btn ds-btn--primary" (click)="generateAssessments()" [disabled]="generating()">
                {{ generating() ? ('common.loading' | translate) : ('assessments.generateAssessments' | translate) }}
              </button>
              <button type="button" class="ds-btn ds-btn--secondary" (click)="closeScopeDrawer()">{{ 'common.close' | translate }}</button>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .filter-row { display: flex; gap: var(--space-md); align-items: center; flex-wrap: wrap; }
    .filter-search { max-width: 280px; }
    .filter-select { max-width: 200px; }
    .table-loading { padding: var(--space-md) 0; }
    .cell-actions { text-align: end; white-space: nowrap; }
    .pagination { display: flex; align-items: center; gap: var(--space-md); margin-top: var(--space-lg); flex-wrap: wrap; }
    .pagination-info { font-size: var(--text-body-sm); color: var(--color-text-secondary); }
    .modal-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(15,23,42,0.5); display: flex; align-items: center; justify-content: center; padding: var(--space-lg); }
    .modal-drawer { max-width: 520px; width: 100%; max-height: 90vh; overflow: auto; }
    .modal-drawer__title { font-size: var(--text-h1); font-weight: 600; margin: 0 0 var(--space-md); }
    .modal-drawer form .form-group { margin-bottom: var(--space-md); }
    .modal-drawer__actions { display: flex; justify-content: flex-end; gap: var(--space-sm); margin-top: var(--space-lg); }
    .scope-drawer { max-width: 900px; width: 100%; max-height: 90vh; overflow: auto; }
    .scope-loading { padding: var(--space-md); color: var(--color-text-secondary); }
    .scope-section { margin-bottom: var(--space-lg); }
    .scope-section__title { font-size: var(--text-body); font-weight: 600; margin: 0 0 var(--space-sm); }
    .scope-list { margin-bottom: var(--space-sm); }
    .scope-list-item { display: flex; justify-content: space-between; align-items: center; padding: var(--space-xs) 0; border-bottom: 1px solid var(--color-border); }
    .scope-empty { font-size: var(--text-body-sm); color: var(--color-text-secondary); padding: var(--space-sm) 0; }
    .scope-add { margin-top: var(--space-xs); }
    .scope-select { max-width: 100%; }
    .scope-select--multi { min-height: 140px; }
    .scope-checklist {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      background: var(--color-bg-elevated);
      max-height: 220px;
      overflow: auto;
      padding: var(--space-sm);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .scope-check-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: var(--text-body-sm);
      color: var(--color-text);
      cursor: pointer;
    }
    .scope-check-item--all {
      padding-bottom: 8px;
      margin-bottom: 8px;
      border-bottom: 1px solid var(--color-border);
      font-weight: 600;
    }
    .scope-check-item--disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .scope-add-actions { margin-top: var(--space-xs); display: flex; justify-content: flex-end; }
    .scope-result { padding: var(--space-md); margin: var(--space-md) 0; background: var(--color-success-subtle, #ecfdf5); border-radius: var(--radius-md); }
    .scope-result--success p { margin: 0.25em 0; }
  `]
})
export class AssessmentCyclesPageComponent implements OnInit {
  private readonly api = inject(AssessmentsApiService);
  private readonly orgApi = inject(OrganizationsApiService);
  private readonly ouApi = inject(OrganizationalUnitsApiService);
  private readonly jobsApi = inject(JobsApiService);
  private readonly employeesApi = inject(EmployeesApiService);
  private readonly auth = inject(AuthService);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(ToastService);

  readonly data = signal<PagedResult<AssessmentCycleListDto> | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly page = signal(1);
  readonly pageSize = 10;
  search = '';
  organizationIdFilter: string | null = null;
  statusFilter: string | null = null;
  searchDebounce: ReturnType<typeof setTimeout> | null = null;

  readonly orgOptions = signal<OrganizationListDto[]>([]);
  readonly showModal = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly modalError = signal<string | null>(null);

  readonly scopeDrawerCycle = signal<AssessmentCycleListDto | null>(null);
  readonly scopeData = signal<AssessmentCycleScopeSummaryDto | null>(null);
  readonly scopeLoading = signal(false);
  readonly scopeError = signal<string | null>(null);
  readonly generationResult = signal<AssessmentGenerationResultDto | null>(null);
  readonly generating = signal(false);
  readonly ouOptions = signal<OrganizationalUnitListDto[]>([]);
  readonly jobOptions = signal<JobListDto[]>([]);
  readonly employeeOptions = signal<EmployeeListDto[]>([]);
  selectedOuIds: string[] = [];
  selectedJobIds: string[] = [];
  selectedEmployeeIds: string[] = [];

  form: CreateAssessmentCycleRequest = {
    code: '',
    nameEn: '',
    nameAr: '',
    descriptionEn: null,
    descriptionAr: null,
    organizationId: '',
    startDate: '',
    endDate: '',
    targetScopeType: null,
    notes: null,
  };

  canCreate = () => this.auth.hasPermission(PermissionCodes.assessmentCycle.create);
  canEdit = () => this.auth.hasPermission(PermissionCodes.assessmentCycle.edit);

  breadcrumbs = computed(() => [{ label: this.translate.instant('assessments.cyclesTitle') }]);

  ngOnInit(): void {
    this.loadOrgOptions();
    this.load();
  }

  getLocalizedText(ar?: string | null, en?: string | null): string {
    const currentLang = (this.translate.currentLang || this.translate.getDefaultLang() || 'en').toLowerCase();
    const prefersArabic = currentLang.startsWith('ar');
    const arText = ar?.trim() ?? '';
    const enText = en?.trim() ?? '';
    if (prefersArabic) return arText || enText || '—';
    return enText || arText || '—';
  }

  getLocalizedOrgName(organizationId: string, fallbackEn?: string | null): string {
    const org = this.orgOptions().find(o => o.id === organizationId);
    if (org) return this.getLocalizedText(org.nameAr, org.nameEn);
    return (fallbackEn?.trim() || '—');
  }

  ouOptionLabel(ou: OrganizationalUnitListDto): string {
    const t = this.getLocalizedText(ou.nameAr, ou.nameEn);
    return t !== '—' ? t : ou.code;
  }

  onCycleStartDateChange(): void {
    if (this.form.startDate && this.form.endDate && this.form.endDate < this.form.startDate) {
      this.form = { ...this.form, endDate: this.form.startDate };
    }
  }

  onCycleEndDateChange(): void {
    if (this.form.startDate && this.form.endDate && this.form.endDate < this.form.startDate) {
      this.form = { ...this.form, startDate: this.form.endDate };
    }
  }

  loadOrgOptions(): void {
    this.orgApi.getPaged({ page: 1, pageSize: 200 }).subscribe({
      next: (res) => {
        if (res.success && res.data) this.orgOptions.set(res.data.items);
      },
    });
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getCyclesPaged({
      page: this.page(),
      pageSize: this.pageSize,
      search: this.search || undefined,
      organizationId: this.organizationIdFilter ?? undefined,
      status: this.statusFilter ?? undefined,
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) this.data.set(res.data);
        else this.error.set(res.message ?? 'Failed to load');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? err.message ?? 'Failed to load');
      },
    });
  }

  onSearchChange(): void {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => { this.page.set(1); this.load(); }, 300);
  }

  onFilterChange(): void {
    this.page.set(1);
    this.load();
  }

  clearFilters(): void {
    this.search = '';
    this.organizationIdFilter = null;
    this.statusFilter = null;
    this.page.set(1);
    this.load();
  }

  prevPage(): void { this.page.update(p => Math.max(1, p - 1)); this.load(); }
  nextPage(): void { this.page.update(p => p + 1); this.load(); }

  openCreate(): void {
    this.editingId.set(null);
    this.form = {
      code: '',
      nameEn: '',
      nameAr: '',
      descriptionEn: null,
      descriptionAr: null,
      organizationId: '',
      startDate: '',
      endDate: '',
      targetScopeType: null,
      notes: null,
    };
    this.modalError.set(null);
    this.showModal.set(true);
  }

  openEdit(c: AssessmentCycleListDto): void {
    this.editingId.set(c.id);
    this.modalError.set(null);
    this.showModal.set(true);
    this.api.getCycleById(c.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const dto: AssessmentCycleDto = res.data;
          this.form = {
            code: dto.code,
            nameEn: dto.nameEn,
            nameAr: dto.nameAr,
            descriptionEn: dto.descriptionEn ?? null,
            descriptionAr: dto.descriptionAr ?? null,
            organizationId: dto.organizationId,
            startDate: dto.startDate.substring(0, 10),
            endDate: dto.endDate.substring(0, 10),
            targetScopeType: dto.targetScopeType ?? null,
            notes: dto.notes ?? null,
          };
        }
      },
    });
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingId.set(null);
  }

  save(): void {
    this.modalError.set(null);
    if (!this.form.code?.trim() || !this.form.nameEn?.trim() || !this.form.organizationId || !this.form.startDate || !this.form.endDate) {
      this.modalError.set(this.translate.instant('validation.required'));
      return;
    }
    const id = this.editingId();
    this.saving.set(true);
    const body: CreateAssessmentCycleRequest = {
      ...this.form,
      organizationId: this.form.organizationId,
      startDate: this.form.startDate,
      endDate: this.form.endDate,
    };
    const obs = id
      ? this.api.updateCycle(id, body as UpdateAssessmentCycleRequest)
      : this.api.createCycle(body);
    obs.subscribe({
      next: (res) => {
        this.saving.set(false);
        if (res.success) {
          this.closeModal();
          this.load();
        } else {
          this.modalError.set(res.message ?? res.errors?.[0] ?? 'Error');
        }
      },
      error: (err) => {
        this.saving.set(false);
        this.modalError.set(err.error?.errors?.[0] ?? err.error?.message ?? 'Error');
      },
    });
  }

  changeStatus(c: AssessmentCycleListDto, status: string): void {
    this.api.changeCycleStatus(c.id, { status }).subscribe({
      next: (res) => {
        if (res.success) this.load();
        else this.error.set(res.message ?? 'Failed to change status');
      },
      error: (err) => {
        this.error.set(err.error?.message ?? err.message ?? 'Failed to change status');
      },
    });
  }

  openScopeDrawer(c: AssessmentCycleListDto): void {
    this.scopeDrawerCycle.set(c);
    this.scopeError.set(null);
    this.generationResult.set(null);
    this.scopeData.set(null);
    this.selectedOuIds = [];
    this.selectedJobIds = [];
    this.selectedEmployeeIds = [];
    this.loadScope();
    this.orgApi.getDefault().subscribe({
      next: (res) => {
        const defaultOrgId = res.success && res.data?.id ? res.data.id : c.organizationId;
        this.ouApi.getPaged({ page: 1, pageSize: 200, organizationId: defaultOrgId }).subscribe({
          next: (r) => { if (r.success && r.data) this.ouOptions.set(r.data.items); },
        });
      },
    });
    this.jobsApi.getPaged({ page: 1, pageSize: 200 }).subscribe({
      next: (res) => { if (res.success && res.data) this.jobOptions.set(res.data.items); },
    });
    this.employeesApi.getPaged({ page: 1, pageSize: 200 }).subscribe({
      next: (res) => { if (res.success && res.data) this.employeeOptions.set(res.data.items); },
    });
  }

  closeScopeDrawer(): void {
    this.scopeDrawerCycle.set(null);
    this.scopeData.set(null);
    this.scopeError.set(null);
    this.generationResult.set(null);
    this.selectedOuIds = [];
    this.selectedJobIds = [];
    this.selectedEmployeeIds = [];
  }

  loadScope(): void {
    const c = this.scopeDrawerCycle();
    if (!c) return;
    this.scopeLoading.set(true);
    this.scopeError.set(null);
    this.api.getCycleScope(c.id).subscribe({
      next: (res) => {
        this.scopeLoading.set(false);
        if (res.success && res.data) this.scopeData.set(res.data);
        else this.scopeError.set(res.message ?? 'Failed to load scope');
      },
      error: (err) => {
        this.scopeLoading.set(false);
        this.scopeError.set(err.error?.message ?? err.message ?? 'Failed to load scope');
      },
    });
  }

  removeScopeOu(ouId: string): void {
    const c = this.scopeDrawerCycle();
    if (!c) return;
    this.api.removeScopeOrganizationalUnit(c.id, ouId).subscribe({
      next: (res) => { if (res.success) this.loadScope(); else this.scopeError.set(res.message ?? 'Error'); },
      error: (err) => this.scopeError.set(err.error?.message ?? err.message ?? 'Error'),
    });
  }

  removeScopeJob(jobId: string): void {
    const c = this.scopeDrawerCycle();
    if (!c) return;
    this.api.removeScopeJob(c.id, jobId).subscribe({
      next: (res) => { if (res.success) this.loadScope(); else this.scopeError.set(res.message ?? 'Error'); },
      error: (err) => this.scopeError.set(err.error?.message ?? err.message ?? 'Error'),
    });
  }

  removeScopeEmployee(employeeId: string): void {
    const c = this.scopeDrawerCycle();
    if (!c) return;
    this.api.removeScopeEmployee(c.id, employeeId).subscribe({
      next: (res) => { if (res.success) this.loadScope(); else this.scopeError.set(res.message ?? 'Error'); },
      error: (err) => this.scopeError.set(err.error?.message ?? err.message ?? 'Error'),
    });
  }

  private scopedOuIds(): Set<string> {
    const d = this.scopeData();
    const set = new Set<string>();
    (d?.organizationalUnits ?? []).forEach(x => set.add(x.organizationalUnitId));
    return set;
  }

  private scopedJobIds(): Set<string> {
    const d = this.scopeData();
    const set = new Set<string>();
    (d?.jobs ?? []).forEach(x => set.add(x.jobId));
    return set;
  }

  private scopedEmployeeIds(): Set<string> {
    const d = this.scopeData();
    const set = new Set<string>();
    (d?.employees ?? []).forEach(x => set.add(x.employeeId));
    return set;
  }

  isOuAlreadyInScope(ouId: string): boolean {
    return this.scopedOuIds().has(ouId);
  }

  toggleOuSelection(ouId: string, checked: boolean): void {
    if (checked) {
      if (!this.selectedOuIds.includes(ouId) && !this.isOuAlreadyInScope(ouId)) {
        this.selectedOuIds = [...this.selectedOuIds, ouId];
      }
      return;
    }
    this.selectedOuIds = this.selectedOuIds.filter(id => id !== ouId);
  }

  areAllSelectableOusSelected(): boolean {
    const selectable = this.ouOptions().filter(ou => !this.isOuAlreadyInScope(ou.id)).map(ou => ou.id);
    return selectable.length > 0 && selectable.every(id => this.selectedOuIds.includes(id));
  }

  toggleSelectAllOus(checked: boolean): void {
    if (!checked) {
      this.selectedOuIds = [];
      return;
    }
    this.selectedOuIds = this.ouOptions().filter(ou => !this.isOuAlreadyInScope(ou.id)).map(ou => ou.id);
  }

  addSelectedOus(): void {
    if (!this.selectedOuIds.length) return;
    const c = this.scopeDrawerCycle();
    if (!c) return;
    const ids = this.selectedOuIds.filter(id => !this.isOuAlreadyInScope(id));
    if (!ids.length) return;
    this.api.addScopeOrganizationalUnits(c.id, { organizationalUnitIds: ids }).subscribe({
      next: (res) => { if (res.success) { this.loadScope(); this.selectedOuIds = []; } else this.scopeError.set(res.message ?? 'Error'); },
      error: (err) => this.scopeError.set(err.error?.message ?? err.message ?? 'Error'),
    });
  }

  addSelectedJobs(): void {
    if (!this.selectedJobIds.length) return;
    const c = this.scopeDrawerCycle();
    if (!c) return;
    const inScope = this.scopedJobIds();
    const ids = this.selectedJobIds.filter(id => !inScope.has(id));
    if (!ids.length) return;
    this.api.addScopeJobs(c.id, { jobIds: ids }).subscribe({
      next: (res) => { if (res.success) { this.loadScope(); this.selectedJobIds = []; } else this.scopeError.set(res.message ?? 'Error'); },
      error: (err) => this.scopeError.set(err.error?.message ?? err.message ?? 'Error'),
    });
  }

  toggleJobSelection(jobId: string, checked: boolean): void {
    if (checked) {
      if (!this.selectedJobIds.includes(jobId)) this.selectedJobIds = [...this.selectedJobIds, jobId];
      return;
    }
    this.selectedJobIds = this.selectedJobIds.filter(id => id !== jobId);
  }

  areAllSelectableJobsSelected(): boolean {
    const inScope = this.scopedJobIds();
    const selectable = this.jobOptions().filter(j => !inScope.has(j.id)).map(j => j.id);
    return selectable.length > 0 && selectable.every(id => this.selectedJobIds.includes(id));
  }

  toggleSelectAllJobs(checked: boolean): void {
    if (!checked) {
      this.selectedJobIds = [];
      return;
    }
    const inScope = this.scopedJobIds();
    this.selectedJobIds = this.jobOptions().filter(j => !inScope.has(j.id)).map(j => j.id);
  }

  addSelectedEmployees(): void {
    if (!this.selectedEmployeeIds.length) return;
    const c = this.scopeDrawerCycle();
    if (!c) return;
    const inScope = this.scopedEmployeeIds();
    const ids = this.selectedEmployeeIds.filter(id => !inScope.has(id));
    if (!ids.length) return;
    this.api.addScopeEmployees(c.id, { employeeIds: ids }).subscribe({
      next: (res) => { if (res.success) { this.loadScope(); this.selectedEmployeeIds = []; } else this.scopeError.set(res.message ?? 'Error'); },
      error: (err) => this.scopeError.set(err.error?.message ?? err.message ?? 'Error'),
    });
  }

  toggleEmployeeSelection(employeeId: string, checked: boolean): void {
    if (checked) {
      if (!this.selectedEmployeeIds.includes(employeeId)) this.selectedEmployeeIds = [...this.selectedEmployeeIds, employeeId];
      return;
    }
    this.selectedEmployeeIds = this.selectedEmployeeIds.filter(id => id !== employeeId);
  }

  areAllSelectableEmployeesSelected(): boolean {
    const inScope = this.scopedEmployeeIds();
    const selectable = this.employeeOptions().filter(e => !inScope.has(e.id)).map(e => e.id);
    return selectable.length > 0 && selectable.every(id => this.selectedEmployeeIds.includes(id));
  }

  toggleSelectAllEmployees(checked: boolean): void {
    if (!checked) {
      this.selectedEmployeeIds = [];
      return;
    }
    const inScope = this.scopedEmployeeIds();
    this.selectedEmployeeIds = this.employeeOptions().filter(e => !inScope.has(e.id)).map(e => e.id);
  }

  generateAssessments(): void {
    const c = this.scopeDrawerCycle();
    if (!c) return;
    this.generating.set(true);
    this.scopeError.set(null);
    this.api.generateAssessmentsForCycle(c.id).subscribe({
      next: (res) => {
        this.generating.set(false);
        if (res.success && res.data) this.generationResult.set(res.data);
        else {
          this.scopeError.set(res.message ?? res.errors?.[0] ?? 'Error');
          this.toast.error(this.translate.instant('dialog.error'));
        }
      },
      error: (err) => {
        this.generating.set(false);
        this.scopeError.set(err.error?.message ?? err.message ?? 'Error');
        this.toast.error(this.translate.instant('dialog.error'));
      },
    });
  }
}

