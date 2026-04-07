import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { TooltipDirective } from '../../../shared/tooltip/tooltip.directive';
import { PortalToBodyDirective } from '../../../shared/portal/portal-to-body.directive';
import { JobCompetencyMappingsApiService } from '../../../core/api/job-competency-mappings/job-competency-mappings-api.service';
import { JobsApiService } from '../../../core/api/jobs/jobs-api.service';
import { CompetenciesApiService } from '../../../core/api/competencies/competencies-api.service';
import { CompetencyFrameworksApiService } from '../../../core/api/competency-frameworks/competency-frameworks-api.service';
import { ProficiencyLevelsApiService } from '../../../core/api/proficiency-levels/proficiency-levels-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/toast/toast.service';
import { PermissionCodes } from '../../../core/auth/permissions';
import { LocalizedTextPipe } from '../../../shared/pipes/localized-text.pipe';
import type { JobCompetencyMappingListDto, CreateJobCompetencyMappingRequest, UpdateJobCompetencyMappingRequest } from '../../../core/api/job-competency-mappings/job-competency-mappings-api.models';
import type { JobListDto } from '../../../core/api/jobs/jobs-api.models';
import type { CompetencyListDto } from '../../../core/api/competencies/competencies-api.models';
import type { ProficiencyLevelListDto } from '../../../core/api/proficiency-levels/proficiency-levels-api.models';
import type { CompetencyFrameworkListDto } from '../../../core/api/competency-frameworks/competency-frameworks-api.models';
import type { PagedResult } from '../../../core/models/api-response';

@Component({
  selector: 'app-job-competency-mappings-page',
  standalone: true,
  imports: [FormsModule, TranslateModule, PageShellComponent, ConfirmDialogComponent, LocalizedTextPipe, TooltipDirective, PortalToBodyDirective],
  template: `
    <app-page-shell [title]="'nav.jobCompetencyMappings' | translate" [breadcrumbs]="breadcrumbs()" [showPageTitle]="false">
      <div class="actions-row" actions>
        @if (canCreate()) {
          <button type="button" class="ds-btn ds-btn--primary ds-btn--sm premium-primary-btn" (click)="openCreate()">
            <span class="premium-primary-btn__icon" aria-hidden="true">
              <svg class="icon-svg" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </span>
            {{ 'common.add' | translate }} {{ 'competency.mapping' | translate }}
          </button>
        }
      </div>
      <div filters>
        <div class="ds-filterbar">
          <div class="ds-filterbar__controls">
            <div class="ds-filterfield">
              <div class="ds-filterfield__label">{{ 'common.search' | translate }}</div>
              <input type="text" class="ds-input filter-search ds-filterfield__control" [(ngModel)]="search" (ngModelChange)="onSearchChange()" [placeholder]="'common.search' | translate" />
            </div>
            <div class="ds-filterfield">
              <div class="ds-filterfield__label">{{ 'table.job' | translate }}</div>
              <select class="ds-input filter-select ds-filterfield__control" [(ngModel)]="jobIdFilter" (ngModelChange)="onFilterChange()">
                <option [ngValue]="null">{{ 'common.all' | translate }}</option>
                @for (j of jobOptions(); track j.id) {
                  <option [ngValue]="j.id">{{ j.titleAr | localizedText:j.titleEn }}</option>
                }
              </select>
            </div>
            <div class="ds-filterfield">
              <div class="ds-filterfield__label">{{ 'competency.framework' | translate }}</div>
              <select class="ds-input filter-select ds-filterfield__control" [(ngModel)]="frameworkIdFilter" (ngModelChange)="onFilterChange()">
                <option [ngValue]="null">{{ 'common.all' | translate }}</option>
                @for (fw of frameworkOptions(); track fw.id) {
                  <option [ngValue]="fw.id">{{ fw.nameAr | localizedText:fw.nameEn }}</option>
                }
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
        <div class="table-loading"><div class="ds-skeleton" style="height: 48px; margin-bottom: 8px;"></div><div class="ds-skeleton" style="height: 48px;"></div></div>
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
                <th>{{ 'table.job' | translate }}</th>
                <th>{{ 'competency.competency' | translate }}</th>
                <th>{{ 'competency.requiredLevel' | translate }}</th>
                <th>{{ 'competency.importanceWeight' | translate }}</th>
                <th>{{ 'competency.mandatory' | translate }}</th>
                <th>{{ 'table.status' | translate }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (m of data()!.items; track m.id) {
                <tr>
                  <td>{{ m.jobTitleEn ?? m.jobCode ?? '—' }}</td>
                  <td>{{ m.competencyNameEn ?? m.competencyCode ?? '—' }}</td>
                  <td>L{{ m.levelNumber }} ({{ m.requiredProficiencyLevelCode ?? '—' }})</td>
                  <td>{{ m.importanceWeight ?? '—' }}</td>
                  <td>{{ m.isMandatory ? ('common.yes' | translate) : ('common.no' | translate) }}</td>
                  <td><span class="ds-badge" [class.ds-badge--success]="m.isActive" [class.ds-badge--neutral]="!m.isActive">{{ m.isActive ? ('status.active' | translate) : ('status.inactive' | translate) }}</span></td>
                  <td class="cell-actions">
                    @if (canEdit()) {
                      <button
                        type="button"
                        class="ds-btn ds-btn--ghost ds-btn--icon premium-icon-btn"
                        (click)="openEdit(m)"
                        [attr.aria-label]="'common.edit' | translate"
                        [appTooltip]="'common.edit' | translate"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="icon-svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"> 
                        <g clip-path="url(#clip0_4418_7276)"> <path d="M15 22.75H9C3.57 22.75 1.25 20.43 1.25 15V9C1.25 3.57 3.57 1.25 9 1.25H11C11.41 1.25 11.75 1.59 11.75 2C11.75 2.41 11.41 2.75 11 2.75H9C4.39 2.75 2.75 4.39 2.75 9V15C2.75 19.61 4.39 21.25 9 21.25H15C19.61 21.25 21.25 19.61 21.25 15V13C21.25 12.59 21.59 12.25 22 12.25C22.41 12.25 22.75 12.59 22.75 13V15C22.75 20.43 20.43 22.75 15 22.75Z" fill="white" style="fill: var(--fillg);"/> <path d="M8.50008 17.6905C7.89008 17.6905 7.33008 17.4705 6.92008 17.0705C6.43008 16.5805 6.22008 15.8705 6.33008 15.1205L6.76008 12.1105C6.84008 11.5305 7.22008 10.7805 7.63008 10.3705L15.5101 2.49055C17.5001 0.500547 19.5201 0.500547 21.5101 2.49055C22.6001 3.58055 23.0901 4.69055 22.9901 5.80055C22.9001 6.70055 22.4201 7.58055 21.5101 8.48055L13.6301 16.3605C13.2201 16.7705 12.4701 17.1505 11.8901 17.2305L8.88008 17.6605C8.75008 17.6905 8.62008 17.6905 8.50008 17.6905ZM16.5701 3.55055L8.69008 11.4305C8.50008 11.6205 8.28008 12.0605 8.24008 12.3205L7.81008 15.3305C7.77008 15.6205 7.83008 15.8605 7.98008 16.0105C8.13008 16.1605 8.37008 16.2205 8.66008 16.1805L11.6701 15.7505C11.9301 15.7105 12.3801 15.4905 12.5601 15.3005L20.4401 7.42055C21.0901 6.77055 21.4301 6.19055 21.4801 5.65055C21.5401 5.00055 21.2001 4.31055 20.4401 3.54055C18.8401 1.94055 17.7401 2.39055 16.5701 3.55055Z" fill="white" style="fill: var(--fillg);"/> <path d="M19.8501 9.83027C19.7801 9.83027 19.7101 9.82027 19.6501 9.80027C17.0201 9.06027 14.9301 6.97027 14.1901 4.34027C14.0801 3.94027 14.3101 3.53027 14.7101 3.41027C15.1101 3.30027 15.5201 3.53027 15.6301 3.93027C16.2301 6.06027 17.9201 7.75027 20.0501 8.35027C20.4501 8.46027 20.6801 8.88027 20.5701 9.28027C20.4801 9.62027 20.1801 9.83027 19.8501 9.83027Z" fill="white" style="fill: var(--fillg);"/> </g> <defs> <clipPath id="clip0_4418_7276"> <rect width="24" height="24" fill="white"/> </clipPath> </defs> </svg>
                      </button>
                      <button
                        type="button"
                        class="ds-btn ds-btn--ghost ds-btn--icon status-toggle-btn premium-icon-btn"
                        [class.status-toggle-btn--active]="m.isActive"
                        (click)="setStatus(m)"
                        [attr.aria-label]="'org.setStatus' | translate"
                        [appTooltip]="'org.setStatus' | translate"
                      >
                      <svg xmlns="http://www.w3.org/2000/svg" class="icon-svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <g clip-path="url(#clip0_4418_7486)">
                        <path d="M14 20.75H10C5.17 20.75 1.25 16.82 1.25 12C1.25 7.18 5.17 3.25 10 3.25H14C18.83 3.25 22.75 7.18 22.75 12C22.75 16.82 18.83 20.75 14 20.75ZM10 4.75C6 4.75 2.75 8 2.75 12C2.75 16 6 19.25 10 19.25H14C18 19.25 21.25 16 21.25 12C21.25 8 18 4.75 14 4.75H10Z" fill="white" style="fill: var(--fillg);"/>
                        <path d="M10 16.75C7.38 16.75 5.25 14.62 5.25 12C5.25 9.38 7.38 7.25 10 7.25C12.62 7.25 14.75 9.38 14.75 12C14.75 14.62 12.62 16.75 10 16.75ZM10 8.75C8.21 8.75 6.75 10.21 6.75 12C6.75 13.79 8.21 15.25 10 15.25C11.79 15.25 13.25 13.79 13.25 12C13.25 10.21 11.79 8.75 10 8.75Z" fill="white" style="fill: var(--fillg);"/>
                        </g>
                        <defs>
                        <clipPath id="clip0_4418_7486">
                        <rect width="24" height="24" fill="white"/>
                        </clipPath>
                        </defs>
                        </svg>
                      </button>
                    }
                    @if (canDelete()) {
                      <button
                        type="button"
                        class="ds-btn ds-btn--ghost ds-btn--icon ds-btn--danger premium-icon-btn"
                        (click)="confirmDelete(m)"
                        [attr.aria-label]="'common.delete' | translate"
                        [appTooltip]="'common.delete' | translate"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#b52828">
                        <g clip-path="url(#clip0_4418_7385)">
                        <path d="M20.9999 6.73046C20.9799 6.73046 20.9499 6.73046 20.9199 6.73046C15.6299 6.20046 10.3499 6.00046 5.11992 6.53046L3.07992 6.73046C2.65992 6.77046 2.28992 6.47046 2.24992 6.05046C2.20992 5.63046 2.50992 5.27046 2.91992 5.23046L4.95992 5.03046C10.2799 4.49046 15.6699 4.70046 21.0699 5.23046C21.4799 5.27046 21.7799 5.64046 21.7399 6.05046C21.7099 6.44046 21.3799 6.73046 20.9999 6.73046Z" fill="white" style="fill: var(--fillg);"/>
                        <path d="M8.50001 5.72C8.46001 5.72 8.42001 5.72 8.37001 5.71C7.97001 5.64 7.69001 5.25 7.76001 4.85L7.98001 3.54C8.14001 2.58 8.36001 1.25 10.69 1.25H13.31C15.65 1.25 15.87 2.63 16.02 3.55L16.24 4.85C16.31 5.26 16.03 5.65 15.63 5.71C15.22 5.78 14.83 5.5 14.77 5.1L14.55 3.8C14.41 2.93 14.38 2.76 13.32 2.76H10.7C9.64001 2.76 9.62001 2.9 9.47001 3.79L9.24001 5.09C9.18001 5.46 8.86001 5.72 8.50001 5.72Z" fill="white" style="fill: var(--fillg);"/>
                        <path d="M15.2099 22.7496H8.7899C5.2999 22.7496 5.1599 20.8196 5.0499 19.2596L4.3999 9.18959C4.3699 8.77959 4.6899 8.41959 5.0999 8.38959C5.5199 8.36959 5.8699 8.67959 5.8999 9.08959L6.5499 19.1596C6.6599 20.6796 6.6999 21.2496 8.7899 21.2496H15.2099C17.3099 21.2496 17.3499 20.6796 17.4499 19.1596L18.0999 9.08959C18.1299 8.67959 18.4899 8.36959 18.8999 8.38959C19.3099 8.41959 19.6299 8.76959 19.5999 9.18959L18.9499 19.2596C18.8399 20.8196 18.6999 22.7496 15.2099 22.7496Z" fill="white" style="fill: var(--fillg);"/>
                        <path d="M13.6601 17.25H10.3301C9.92008 17.25 9.58008 16.91 9.58008 16.5C9.58008 16.09 9.92008 15.75 10.3301 15.75H13.6601C14.0701 15.75 14.4101 16.09 14.4101 16.5C14.4101 16.91 14.0701 17.25 13.6601 17.25Z" fill="white" style="fill: var(--fillg);"/>
                        <path d="M14.5 13.25H9.5C9.09 13.25 8.75 12.91 8.75 12.5C8.75 12.09 9.09 11.75 9.5 11.75H14.5C14.91 11.75 15.25 12.09 15.25 12.5C15.25 12.91 14.91 13.25 14.5 13.25Z" fill="white" style="fill: var(--fillg);"/>
                        </g>
                        <defs>
                        <clipPath id="clip0_4418_7385">
                        <rect width="24" height="24" fill="white"/>
                        </clipPath>
                        </defs>
                        </svg>
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
      <div
        class="modal-overlay"
        appPortalToBody
        (mousedown)="$event.preventDefault(); $event.stopPropagation()"
        (click)="$event.preventDefault(); $event.stopPropagation(); closeModal()"
      >
        <div class="modal-drawer premium-modal" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
          <div class="premium-modal__header">
            <div class="premium-modal__titlewrap">
              <h3 class="premium-modal__title">{{ editingId() ? ('common.edit' | translate) : ('common.add' | translate) }} {{ 'competency.mapping' | translate }}</h3>
              <p class="premium-modal__subtitle">{{ 'nav.jobCompetencyMappings' | translate }}</p>
            </div>
            <button type="button" class="ds-btn ds-btn--ghost ds-btn--icon premium-modal__close" (click)="closeModal($event)" [attr.aria-label]="'common.close' | translate" [appTooltip]="'common.close' | translate">
              <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <div class="premium-modal__body">
            @if (modalError()) {
              <div class="premium-modal__error">
                <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 9v4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <path d="M12 17h.01" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                </svg>
                <p class="premium-modal__error-text">{{ modalError() }}</p>
              </div>
            }

            <form class="premium-form" (ngSubmit)="save()">
            <div class="form-group">
              <label class="ds-label">{{ 'table.job' | translate }}</label>
              <select class="ds-input" [(ngModel)]="form.jobId" name="jobId" [disabled]="!!editingId()">
                @for (j of jobOptions(); track j.id) {
                  <option [ngValue]="j.id">{{ j.titleAr | localizedText:j.titleEn }} ({{ j.code }})</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'competency.competency' | translate }}</label>
              <select class="ds-input" [(ngModel)]="form.competencyId" name="competencyId" (ngModelChange)="onCompetencyChange()" [disabled]="!!editingId()">
                @for (c of competencyOptions(); track c.id) {
                  <option [ngValue]="c.id">{{ c.nameAr | localizedText:c.nameEn }} ({{ c.code }})</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'competency.requiredLevel' | translate }}</label>
              <select class="ds-input" [(ngModel)]="form.requiredProficiencyLevelId" name="requiredProficiencyLevelId">
                @for (l of levelOptions(); track l.id) {
                  <option [ngValue]="l.id">L{{ l.levelNumber }} - {{ l.nameAr | localizedText:l.nameEn }} ({{ l.code }})</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'competency.importanceWeight' | translate }}</label>
              <input type="number" class="ds-input" [(ngModel)]="form.importanceWeight" name="importanceWeight" min="0" />
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'competency.mandatory' | translate }}</label>
              <select class="ds-input" [(ngModel)]="form.isMandatory" name="isMandatory">
                <option [ngValue]="false">{{ 'common.no' | translate }}</option>
                <option [ngValue]="true">{{ 'common.yes' | translate }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'table.notes' | translate }}</label>
              <textarea class="ds-textarea" [(ngModel)]="form.notes" name="notes" rows="2"></textarea>
            </div>
            <div class="premium-modal__footer">
              <button type="button" class="ds-btn ds-btn--secondary premium-secondary-btn" (click)="closeModal($event)">{{ 'common.cancel' | translate }}</button>
              <button type="submit" class="ds-btn ds-btn--primary premium-primary-btn" [disabled]="saving()">{{ saving() ? ('common.loading' | translate) : ('common.save' | translate) }}</button>
            </div>
          </form>
          </div>
        </div>
      </div>
    }

    @if (showConfirm()) {
      <app-confirm-dialog
        [title]="'dialog.confirmDelete' | translate"
        [message]="deleteConfirmMessage()"
        [confirmLabel]="'common.delete' | translate"
        [cancelLabel]="'common.cancel' | translate"
        (confirm)="doDelete()"
        (cancel)="cancelDelete()"
      />
    }
  `,
  styles: [`
    .filter-row { display: flex; gap: var(--space-md); align-items: center; flex-wrap: wrap; }
    .filter-search { max-width: 280px; }
    .filter-select { max-width: 200px; }
    .table-loading { padding: var(--space-md) 0; }
    .cell-actions { text-align: end; }
    .status-toggle-btn { color: var(--color-text-secondary, #64748b); }
    .status-toggle-btn.status-toggle-btn--active { color: #22c55e; }
    .status-toggle-btn.status-toggle-btn--active:hover { background: rgba(34, 197, 94, 0.18); }
    .pagination { display: flex; align-items: center; gap: var(--space-md); margin-top: var(--space-lg); flex-wrap: wrap; }
    .pagination-info { font-size: var(--text-body-sm); color: var(--color-text-secondary); }
    .premium-primary-btn {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border-radius: 14px;
      background: linear-gradient(145deg, var(--gulf-green-800), color-mix(in srgb, var(--gulf-green-700) 86%, var(--gulf-gold) 14%));
      border-color: color-mix(in srgb, var(--gulf-gold) 28%, transparent);
      box-shadow: 0 10px 28px rgba(15, 61, 46, 0.16), 0 0 22px rgba(200, 164, 93, 0.12);
      transition: transform 0.18s ease, box-shadow 0.22s ease;
    }
    .premium-primary-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 14px 34px rgba(15, 61, 46, 0.2), 0 0 30px rgba(200, 164, 93, 0.16);
    }
    .premium-primary-btn__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.14);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18);
    }
    .premium-icon-btn:hover:not(:disabled) { background: color-mix(in srgb, var(--gulf-gold) 10%, var(--color-bg-subtle)); }

    .modal-overlay {
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      background: radial-gradient(ellipse 85% 65% at 50% 0%, rgba(200, 164, 93, 0.16), transparent 55%), rgba(15,23,42,0.58);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-lg);
    }

    .modal-drawer { max-width: 720px; width: 100%; max-height: 90vh; overflow: hidden; border-radius: 20px; }
    .premium-modal {
      border: 1px solid color-mix(in srgb, var(--gulf-gold) 30%, var(--color-border));
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.88) 0%, color-mix(in srgb, var(--color-bg-elevated) 92%, var(--gulf-emerald) 6%) 100%);
      box-shadow: 0 30px 70px rgba(0, 0, 0, 0.25), 0 0 28px rgba(200, 164, 93, 0.14);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      max-height: 90vh;
    }
    .premium-modal__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--space-md);
      padding: 18px 18px 14px;
      background: linear-gradient(
        135deg,
        color-mix(in srgb, var(--gulf-green-800) 92%, #000) 0%,
        var(--gulf-green-800) 55%,
        color-mix(in srgb, var(--gulf-gold) 18%, var(--gulf-green-700)) 100%
      );
      color: var(--gulf-text);
      border-bottom: 1px solid rgba(255, 255, 255, 0.14);
      position: relative;
      overflow: hidden;
    }
    .premium-modal__header::after {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse 80% 60% at 0% 0%, rgba(200, 164, 93, 0.22), transparent 55%);
      pointer-events: none;
    }
    .premium-modal__titlewrap { position: relative; z-index: 1; min-width: 0; }
    .premium-modal__title { margin: 0; font-size: 1.15rem; font-weight: 800; letter-spacing: -0.02em; text-shadow: 0 1px 18px rgba(0,0,0,0.22); }
    .premium-modal__subtitle { margin: 0.25rem 0 0; font-size: 0.85rem; font-weight: 600; color: rgba(248, 250, 248, 0.8); }
    .premium-modal__close {
      position: relative;
      z-index: 1;
      background: rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.95);
      border: 1px solid rgba(255,255,255,0.18);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.12);
    }
    .premium-modal__close:hover:not(:disabled) {
      background: rgba(255,255,255,0.18);
      border-color: rgba(200,164,93,0.6);
      box-shadow: 0 0 18px rgba(200,164,93,0.18), inset 0 1px 0 rgba(255,255,255,0.16);
    }
    .premium-modal__body { padding: 18px; overflow: auto; flex: 1 1 auto; -webkit-overflow-scrolling: touch; }
    .premium-form .form-group { margin-bottom: var(--space-md); }
    .premium-modal__footer {
      position: sticky;
      bottom: 0;
      display: flex;
      justify-content: flex-end;
      gap: var(--space-sm);
      padding: 14px 18px;
      background: linear-gradient(180deg, rgba(255,255,255,0.72), rgba(255,255,255,0.92));
      border-top: 1px solid color-mix(in srgb, var(--gulf-gold) 16%, var(--color-border));
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }
    .premium-secondary-btn:hover:not(:disabled) {
      border-color: var(--gulf-gold);
      box-shadow: 0 0 18px rgba(200, 164, 93, 0.14);
    }
    .premium-modal__error {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px 12px;
      border-radius: 14px;
      border: 1px solid color-mix(in srgb, var(--gulf-gold) 18%, rgba(211,47,47,0.28));
      background: linear-gradient(180deg, rgba(253, 236, 234, 0.85), rgba(255,255,255,0.7));
      box-shadow: 0 10px 26px rgba(211,47,47,0.08);
      margin-bottom: var(--space-md);
    }
    .premium-modal__error .icon-svg { width: 18px; height: 18px; color: #b91c1c; margin-top: 2px; }
    .premium-modal__error-text { margin: 0; font-size: var(--text-body-sm); color: color-mix(in srgb, var(--color-text) 80%, #b91c1c 20%); line-height: 1.4; }
  `]
})
export class JobCompetencyMappingsPageComponent implements OnInit {
  private readonly api = inject(JobCompetencyMappingsApiService);
  private readonly jobApi = inject(JobsApiService);
  private readonly competencyApi = inject(CompetenciesApiService);
  private readonly frameworkApi = inject(CompetencyFrameworksApiService);
  private readonly levelApi = inject(ProficiencyLevelsApiService);
  private readonly auth = inject(AuthService);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(ToastService);

  readonly data = signal<PagedResult<JobCompetencyMappingListDto> | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly page = signal(1);
  readonly pageSize = 10;
  search = '';
  jobIdFilter: string | null = null;
  frameworkIdFilter: string | null = null;
  searchDebounce: ReturnType<typeof setTimeout> | null = null;

  readonly jobOptions = signal<JobListDto[]>([]);
  readonly frameworkOptions = signal<CompetencyFrameworkListDto[]>([]);
  readonly competencyOptions = signal<CompetencyListDto[]>([]);
  readonly levelOptions = signal<ProficiencyLevelListDto[]>([]);
  readonly showModal = signal(false);
  readonly modalClosing = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly modalError = signal<string | null>(null);

  readonly showConfirm = signal(false);
  readonly toDelete = signal<JobCompetencyMappingListDto | null>(null);

  form: CreateJobCompetencyMappingRequest = {
    jobId: '',
    competencyId: '',
    requiredProficiencyLevelId: '',
    importanceWeight: null,
    isMandatory: false,
    notes: null,
  };

  canCreate = () => this.auth.hasPermission(PermissionCodes.jobCompetency.create);
  canEdit = () => this.auth.hasPermission(PermissionCodes.jobCompetency.edit);
  canDelete = () => this.auth.hasPermission(PermissionCodes.jobCompetency.delete);

  breadcrumbs = computed(() => [{ label: this.translate.instant('nav.competency') }, { label: this.translate.instant('nav.jobCompetencyMappings') }]);

  ngOnInit(): void {
    this.loadJobOptions();
    this.loadFrameworkOptions();
    this.loadCompetencyOptions();
    this.load();
  }

  confirmDelete(m: JobCompetencyMappingListDto): void {
    this.toDelete.set(m);
    this.showConfirm.set(true);
  }

  cancelDelete(): void {
    this.showConfirm.set(false);
    this.toDelete.set(null);
  }

  deleteConfirmMessage = computed(() => {
    const m = this.toDelete();
    if (!m) return '';
    return this.translate.instant('dialog.confirmDelete');
  });

  doDelete(): void {
    const target = this.toDelete();
    if (!target) return;
    this.showConfirm.set(false);
    this.api.delete(target.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success(this.translate.instant('common.deleted'));
          this.load();
        } else {
          this.toast.error(res.message || this.translate.instant('dialog.error'));
        }
      },
      error: (err) => {
        this.toast.error(err.error?.message ?? err.message ?? this.translate.instant('dialog.error'));
      },
    });
  }

  loadJobOptions(): void {
    this.jobApi.getPaged({ page: 1, pageSize: 500, isActive: true }).subscribe({
      next: (res) => {
        if (res.success && res.data) this.jobOptions.set(res.data.items);
      },
    });
  }

  loadFrameworkOptions(): void {
    this.frameworkApi.getPaged({ page: 1, pageSize: 500, isActive: true }).subscribe({
      next: (res) => {
        if (res.success && res.data) this.frameworkOptions.set(res.data.items);
      },
    });
  }

  loadCompetencyOptions(): void {
    this.competencyApi.getPaged({ page: 1, pageSize: 500, isActive: true }).subscribe({
      next: (res) => {
        if (res.success && res.data) this.competencyOptions.set(res.data.items);
      },
    });
  }

  onCompetencyChange(): void {
    const comp = this.competencyOptions().find(c => c.id === this.form.competencyId);
    if (comp) {
      this.levelApi.getPaged({ page: 1, pageSize: 100, frameworkId: comp.frameworkId, isActive: true }).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.levelOptions.set(res.data.items);
            if (!this.editingId() && res.data.items.length && !this.form.requiredProficiencyLevelId) {
              this.form.requiredProficiencyLevelId = res.data.items[0].id;
            }
          }
        },
      });
    } else {
      this.levelOptions.set([]);
    }
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getPaged({
      page: this.page(),
      pageSize: this.pageSize,
      search: this.search || undefined,
      jobId: this.jobIdFilter ?? undefined,
      frameworkId: this.frameworkIdFilter ?? undefined,
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
    this.jobIdFilter = null;
    this.frameworkIdFilter = null;
    this.page.set(1);
    this.load();
  }

  prevPage(): void { this.page.update(p => Math.max(1, p - 1)); this.load(); }
  nextPage(): void { this.page.update(p => p + 1); this.load(); }

  openCreate(): void {
    if (this.modalClosing()) return;
    this.editingId.set(null);
    this.form = { jobId: this.jobOptions()[0]?.id ?? '', competencyId: '', requiredProficiencyLevelId: '', importanceWeight: null, isMandatory: false, notes: null };
    this.levelOptions.set([]);
    this.modalError.set(null);
    this.showModal.set(true);
  }

  openEdit(m: JobCompetencyMappingListDto): void {
    if (this.modalClosing()) return;
    this.editingId.set(m.id);
    this.modalError.set(null);
    this.showModal.set(true);
    this.api.getById(m.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.form = {
            jobId: res.data.jobId,
            competencyId: res.data.competencyId,
            requiredProficiencyLevelId: res.data.requiredProficiencyLevelId,
            importanceWeight: res.data.importanceWeight ?? null,
            isMandatory: res.data.isMandatory,
            notes: res.data.notes ?? null,
          };
          this.onCompetencyChange();
        }
      },
    });
  }

  closeModal(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    if (this.modalClosing()) return;
    this.modalClosing.set(true);
    setTimeout(() => {
      this.showModal.set(false);
      this.editingId.set(null);
      this.modalClosing.set(false);
    }, 0);
  }

  save(): void {
    this.modalError.set(null);
    const id = this.editingId();
    if (id) {
      this.saving.set(true);
      const update: UpdateJobCompetencyMappingRequest = {
        requiredProficiencyLevelId: this.form.requiredProficiencyLevelId,
        importanceWeight: this.form.importanceWeight,
        isMandatory: this.form.isMandatory,
        notes: this.form.notes,
      };
      this.api.update(id, update).subscribe({
        next: () => { this.saving.set(false); this.closeModal(); this.load(); },
        error: (err) => { this.saving.set(false); this.modalError.set(err.error?.errors?.[0] ?? err.error?.message ?? 'Error'); },
      });
    } else {
      if (!this.form.jobId || !this.form.competencyId || !this.form.requiredProficiencyLevelId) {
        this.modalError.set(this.translate.instant('validation.required'));
        return;
      }
      this.saving.set(true);
      this.api.create(this.form).subscribe({
        next: () => { this.saving.set(false); this.closeModal(); this.load(); },
        error: (err) => { this.saving.set(false); this.modalError.set(err.error?.errors?.[0] ?? err.error?.message ?? 'Error'); },
      });
    }
  }

  setStatus(m: JobCompetencyMappingListDto): void {
    this.api.setStatus(m.id, { isActive: !m.isActive }).subscribe({
      next: () => this.load(),
      error: (err) => this.error.set(err.error?.message ?? err.message ?? 'Failed to set status'),
    });
  }
}
