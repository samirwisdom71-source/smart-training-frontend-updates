import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { TooltipDirective } from '../../../shared/tooltip/tooltip.directive';
import { PositionsApiService } from '../../../core/api/positions/positions-api.service';
import { JobsApiService } from '../../../core/api/jobs/jobs-api.service';
import { OrganizationsApiService } from '../../../core/api/organizations/organizations-api.service';
import { OrganizationalUnitsApiService } from '../../../core/api/organizational-units/organizational-units-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionCodes } from '../../../core/auth/permissions';
import type { PositionListDto, CreatePositionRequest, UpdatePositionRequest } from '../../../core/api/positions/positions-api.models';
import type { JobListDto } from '../../../core/api/jobs/jobs-api.models';
import type { OrganizationalUnitListDto } from '../../../core/api/organizational-units/organizational-units-api.models';
import type { PagedResult } from '../../../core/models/api-response';
import { ToastService } from '../../../core/toast/toast.service';

@Component({
  selector: 'app-positions-page',
  standalone: true,
  imports: [FormsModule, TranslateModule, PageShellComponent, ConfirmDialogComponent, TooltipDirective],
  template: `
    <app-page-shell [title]="'nav.positions' | translate" [breadcrumbs]="breadcrumbs()" [showPageTitle]="false">
      <div class="positions-page ds-animate-fade-up" data-delay="1">
        <header class="positions-hero">
          <div class="positions-hero__inner">
            <h1 class="positions-hero__title">{{ 'nav.positions' | translate }}</h1>
            <p class="positions-hero__subtitle">{{ 'positions.pageSubtitle' | translate }}</p>
          </div>
        </header>

        <div class="actions-row positions-actions" actions>
        @if (canCreate()) {
          <button type="button" class="ds-btn ds-btn--primary ds-btn--sm positions-primary-btn" (click)="openCreate()">{{ 'common.add' | translate }} {{ 'table.position' | translate }}</button>
        }
        </div>
      <div filters>
        <div class="ds-filterbar positions-filterbar">
          <div class="ds-filterbar__controls">
            <div class="ds-filterfield">
              <div class="ds-filterfield__label">{{ 'common.search' | translate }}</div>
              <input type="text" class="ds-input filter-search ds-filterfield__control positions-input" [(ngModel)]="search" (ngModelChange)="onSearchChange()" [placeholder]="'common.search' | translate" />
            </div>
            <div class="ds-filterfield">
              <div class="ds-filterfield__label">{{ 'table.organizationalUnit' | translate }}</div>
              <select class="ds-input filter-select ds-filterfield__control positions-input" [(ngModel)]="organizationalUnitIdFilter" (ngModelChange)="onFilterChange()">
                <option [ngValue]="null">{{ 'common.all' | translate }}</option>
                @for (ou of ouOptions(); track ou.id) {
                  <option [ngValue]="ou.id">{{ getLocalizedText(ou.nameAr, ou.nameEn) }}</option>
                }
              </select>
            </div>
            <div class="ds-filterfield">
              <div class="ds-filterfield__label">{{ 'table.job' | translate }}</div>
              <select class="ds-input filter-select ds-filterfield__control positions-input" [(ngModel)]="jobIdFilter" (ngModelChange)="onFilterChange()">
                <option [ngValue]="null">{{ 'common.all' | translate }}</option>
                @for (j of jobOptions(); track j.id) {
                  <option [ngValue]="j.id">{{ getLocalizedText(j.titleAr, j.titleEn) }}</option>
                }
              </select>
            </div>
            <div class="ds-filterfield">
              <div class="ds-filterfield__label">{{ 'table.status' | translate }}</div>
              <select class="ds-input filter-select ds-filterfield__control positions-input" [(ngModel)]="isActiveFilter" (ngModelChange)="onFilterChange()">
                <option [ngValue]="null">{{ 'common.all' | translate }}</option>
                <option [ngValue]="true">{{ 'status.active' | translate }}</option>
                <option [ngValue]="false">{{ 'status.inactive' | translate }}</option>
              </select>
            </div>
          </div>
          <div class="ds-filterbar__actions">
            <button type="button" class="ds-btn ds-btn--secondary ds-btn--sm positions-secondary-btn" (click)="clearFilters()">
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
        <div class="ds-table-wrap positions-table-wrap">
          <table class="ds-table positions-table">
            <thead>
              <tr>
                <th>{{ 'table.code' | translate }}</th>
                <th>{{ 'table.jobTitle' | translate }}</th>
                <th>{{ 'table.organizationalUnit' | translate }}</th>
                <th>{{ 'table.reportsTo' | translate }}</th>
                <th>{{ 'table.status' | translate }}</th>
                <th class="col-vacant">{{ 'table.isVacant' | translate }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (p of data()!.items; track p.id) {
                <tr>
                  <td>{{ p.code }}</td>
                  <td>{{ getLocalizedJobTitleForPosition(p) }}</td>
                  <td>{{ getLocalizedOuName(p.organizationalUnitId, p.organizationalUnitNameAr, p.organizationalUnitNameEn) }}</td>
                  <td>{{ getReportsToPositionLabel(p) }}</td>
                  <td><span class="ds-badge" [class.ds-badge--success]="p.isActive" [class.ds-badge--neutral]="!p.isActive">{{ p.isActive ? ('status.active' | translate) : ('status.inactive' | translate) }}</span></td>
                  <td class="cell-vacant">
                    @if (canEdit()) {
                      <button
                        type="button"
                        class="ds-btn ds-btn--ghost ds-btn--icon vacant-btn positions-icon-btn"
                        [class.vacant-btn--vacant]="p.isVacant"
                        (click)="toggleVacant(p)"
                        [attr.aria-label]="(p.isVacant ? 'positions.setOccupied' : 'positions.setVacant') | translate"
                        [appTooltip]="(p.isVacant ? 'positions.setOccupied' : 'positions.setVacant') | translate"
                      >
                        <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" [attr.fill]="p.isVacant ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.5"/>
                        </svg>
                      </button>
                    } @else {
                      <span class="vacant-label" [class.vacant-label--yes]="p.isVacant">{{ p.isVacant ? ('common.yes' | translate) : ('common.no' | translate) }}</span>
                    }
                  </td>
                  <td class="cell-actions">
                    @if (canEdit()) {
                      <button
                        type="button"
                        class="ds-btn ds-btn--ghost ds-btn--icon positions-icon-btn"
                        (click)="openEdit(p)"
                        [attr.aria-label]="'common.edit' | translate"
                        [appTooltip]="'common.edit' | translate"
                      >
                        <svg class="icon-svg" viewBox="0 0 24 24">
                          <path d="M4 17.5V20h2.5L17 9.5 14.5 7 4 17.5Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                          <path d="M13.5 6.5 16 4l3 3-2.5 2.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                        </svg>
                      </button>
                      <button
                        type="button"
                        class="ds-btn ds-btn--ghost ds-btn--icon status-toggle-btn positions-icon-btn"
                        [class.status-toggle-btn--active]="p.isActive"
                        (click)="setStatus(p)"
                        [attr.aria-label]="'org.setStatus' | translate"
                        [appTooltip]="'org.setStatus' | translate"
                      >
                        <svg class="icon-svg" viewBox="0 0 24 24">
                          <rect x="3" y="7" width="18" height="10" rx="5" fill="none" stroke="currentColor" stroke-width="1.6"/>
                          <circle cx="8" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.6"/>
                        </svg>
                      </button>
                    }
                    @if (canDelete()) {
                      <button
                        type="button"
                        class="ds-btn ds-btn--ghost ds-btn--icon ds-btn--danger positions-icon-btn"
                        (click)="confirmDelete(p)"
                        [attr.aria-label]="'common.delete' | translate"
                        [appTooltip]="'common.delete' | translate"
                      >
                        <svg class="icon-svg" viewBox="0 0 24 24">
                          <path d="M6 19V7h12v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2Z" fill="none" stroke="currentColor" stroke-width="1.6" />
                          <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M4 7h16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
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
      </div>
    </app-page-shell>

    @if (showModal()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal-drawer premium-modal" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
          <div class="premium-modal__header">
            <div class="premium-modal__titlewrap">
              <h3 class="premium-modal__title">{{ editingId() ? ('common.edit' | translate) : ('common.add' | translate) }} {{ 'table.position' | translate }}</h3>
              <p class="premium-modal__subtitle">{{ 'nav.positions' | translate }}</p>
            </div>
            <button type="button" class="ds-btn ds-btn--ghost ds-btn--icon premium-modal__close" (click)="closeModal()" [attr.aria-label]="'common.close' | translate" [appTooltip]="'common.close' | translate">
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
              <label class="ds-label">{{ 'table.code' | translate }}</label>
              <input type="text" class="ds-input" [(ngModel)]="form.code" name="code" />
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'table.job' | translate }}</label>
              <select class="ds-input" [(ngModel)]="form.jobId" name="jobId" required>
                <option [ngValue]="null" disabled>—</option>
                @for (j of jobOptions(); track j.id) {
                  <option [ngValue]="j.id">{{ getLocalizedText(j.titleAr, j.titleEn) }} ({{ j.code }})</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'table.organizationalUnit' | translate }}</label>
              <select class="ds-input" [(ngModel)]="form.organizationalUnitId" name="organizationalUnitId" required (ngModelChange)="onFormOrganizationalUnitChange($event)">
                <option [ngValue]="null" disabled>—</option>
                @for (ou of ouOptions(); track ou.id) {
                  <option [ngValue]="ou.id">{{ getLocalizedText(ou.nameAr, ou.nameEn) }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'table.reportsTo' | translate }}</label>
              <p class="ds-hint" aria-hidden="true">{{ 'positions.reportsToHint' | translate }}</p>
              <select class="ds-input" [(ngModel)]="form.reportsToPositionId" name="reportsToPositionId" [disabled]="!form.organizationalUnitId">
                <option [ngValue]="null">—</option>
                @for (pos of positionOptions(); track pos.id) {
                  @if (pos.id !== editingId() && pos.organizationalUnitId === form.organizationalUnitId) {
                    <option [ngValue]="pos.id">{{ pos.code }} ({{ getLocalizedJobTitleForPosition(pos) }})</option>
                  }
                }
              </select>
            </div>
            <div class="premium-modal__footer">
              <button type="button" class="ds-btn ds-btn--secondary positions-secondary-btn" (click)="closeModal()">{{ 'common.cancel' | translate }}</button>
              <button type="submit" class="ds-btn ds-btn--primary positions-primary-btn" [disabled]="saving()">{{ saving() ? ('common.loading' | translate) : ('common.save' | translate) }}</button>
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
    .positions-page {
      --positions-border: color-mix(in srgb, var(--gulf-gold) 18%, var(--color-border-light));
      --positions-shadow-card: 0 12px 34px rgba(15, 61, 46, 0.08);
    }

    .positions-hero {
      margin-block-end: var(--space-md);
      padding: var(--space-lg) var(--space-xl);
      border-radius: 20px;
      background: linear-gradient(
        135deg,
        color-mix(in srgb, var(--gulf-green-800) 92%, #000) 0%,
        var(--gulf-green-800) 42%,
        color-mix(in srgb, var(--gulf-green-700) 88%, var(--gulf-gold) 12%) 100%
      );
      color: var(--gulf-text);
      border: 1px solid color-mix(in srgb, var(--gulf-gold) 35%, transparent);
      box-shadow:
        0 16px 40px rgba(11, 42, 33, 0.18),
        0 0 0 1px rgba(255, 255, 255, 0.06) inset,
        0 0 48px rgba(200, 164, 93, 0.12);
      position: relative;
      overflow: hidden;
    }

    .positions-hero::after {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse 80% 60% at 0% 0%, rgba(200, 164, 93, 0.18), transparent 55%);
      pointer-events: none;
    }

    .positions-hero__inner { position: relative; z-index: 1; }
    .positions-hero__title { margin: 0 0 var(--space-xs); font-size: clamp(1.35rem, 2.5vw, 1.75rem); font-weight: 800; letter-spacing: -0.02em; text-shadow: 0 1px 18px rgba(0,0,0,0.2); }
    .positions-hero__subtitle { margin: 0; font-size: var(--text-body-sm); font-weight: 600; color: var(--gulf-text-muted); max-width: 52rem; line-height: var(--line-height-normal); }

    .positions-actions { margin-bottom: var(--space-md); }
    .positions-primary-btn { background: linear-gradient(145deg, var(--gulf-green-800), color-mix(in srgb, var(--gulf-green-700) 86%, var(--gulf-gold) 14%)); border-color: color-mix(in srgb, var(--gulf-gold) 28%, transparent); box-shadow: 0 10px 28px rgba(15, 61, 46, 0.16), 0 0 22px rgba(200, 164, 93, 0.12); }
    .positions-secondary-btn:hover:not(:disabled) { border-color: var(--gulf-gold); box-shadow: 0 0 18px rgba(200, 164, 93, 0.14); }

    .filter-row { display: flex; gap: var(--space-md); align-items: center; flex-wrap: wrap; }
    .filter-search { max-width: 280px; }
    .filter-select { max-width: 200px; }
    .positions-filterbar {
      padding: var(--space-md) var(--space-lg);
      border-radius: 18px;
      margin-bottom: var(--space-md);

      border: 1px solid var(--positions-border);
      background: linear-gradient(180deg, rgba(255,255,255,0.92) 0%, color-mix(in srgb, var(--color-bg-elevated) 92%, var(--gulf-emerald) 6%) 100%);
      box-shadow: var(--positions-shadow-card), inset 0 1px 0 rgba(255,255,255,0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }
    .positions-input { border-radius: 14px; }

    .table-loading { padding: var(--space-md) 0; }
    .cell-actions { text-align: end; }
    .status-toggle-btn { color: var(--color-text-secondary, #64748b); }
    .status-toggle-btn .icon-svg { width: 22px; height: 22px; }
    .status-toggle-btn.status-toggle-btn--active { color: #22c55e; }
    .status-toggle-btn.status-toggle-btn--active:hover { background: rgba(34, 197, 94, 0.18); }
    .positions-icon-btn:hover:not(:disabled) { background: color-mix(in srgb, var(--gulf-gold) 10%, var(--color-bg-subtle)); }

    .positions-table-wrap {
      border-radius: 18px;
      border-color: var(--positions-border);
      box-shadow: var(--positions-shadow-card);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      overflow: hidden;
    }

    .positions-table th {
      background: linear-gradient(
        135deg,
        color-mix(in srgb, var(--gulf-green-800) 92%, #000) 0%,
        var(--gulf-green-800) 58%,
        color-mix(in srgb, var(--gulf-green-700) 88%, var(--gulf-gold) 12%) 100%
      );
    }

    .pagination { display: flex; align-items: center; gap: var(--space-md); margin-top: var(--space-lg); flex-wrap: wrap; }
    .pagination-info { font-size: var(--text-body-sm); color: var(--color-text-secondary); }
    .modal-overlay {
      position: fixed;
      inset: 0;
      z-index: 5000;
      background: radial-gradient(ellipse 85% 65% at 50% 0%, rgba(200, 164, 93, 0.16), transparent 55%), rgba(15,23,42,0.58);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-lg);
    }

    .modal-drawer { max-width: 640px; width: 100%; max-height: 90vh; overflow: auto; border-radius: 20px; }

    .premium-modal {
      border: 1px solid color-mix(in srgb, var(--gulf-gold) 30%, var(--color-border));
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.88) 0%, color-mix(in srgb, var(--color-bg-elevated) 92%, var(--gulf-emerald) 6%) 100%);
      box-shadow: 0 30px 70px rgba(0, 0, 0, 0.25), 0 0 28px rgba(200, 164, 93, 0.14);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      overflow: hidden;
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

    .premium-modal__body { padding: 18px; }
    .premium-form .form-group { margin-bottom: var(--space-md); }
    .ds-hint { font-size: var(--text-body-sm, 0.875rem); color: var(--color-text-secondary, #64748b); margin: 0 0 var(--space-xs); }

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

    .premium-modal__footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-sm);
      margin-top: var(--space-lg);
      padding-top: var(--space-md);
      border-top: 1px solid color-mix(in srgb, var(--gulf-green-800) 8%, var(--color-border-light));
    }

    @media (max-width: 560px) {
      .premium-modal__footer { flex-direction: column-reverse; align-items: stretch; }
      .modal-overlay { padding: var(--space-md); }
    }
    .col-vacant { width: 1%; white-space: nowrap; }
    .cell-vacant { text-align: center; }
    .vacant-btn { color: var(--color-text-secondary, #64748b); }
    .vacant-btn.vacant-btn--vacant { color: var(--color-warning, #f59e0b); }
    .vacant-label { font-size: var(--text-body-sm); color: var(--color-text-secondary); }
    .vacant-label.vacant-label--yes { color: var(--color-warning, #f59e0b); font-weight: 500; }
  `]
})
export class PositionsPageComponent implements OnInit {
  private readonly api = inject(PositionsApiService);
  private readonly jobApi = inject(JobsApiService);
  private readonly orgApi = inject(OrganizationsApiService);
  private readonly ouApi = inject(OrganizationalUnitsApiService);
  private readonly auth = inject(AuthService);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(ToastService);

  readonly data = signal<PagedResult<PositionListDto> | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly page = signal(1);
  readonly pageSize = 10;
  search = '';
  organizationalUnitIdFilter: string | null = null;
  jobIdFilter: string | null = null;
  isActiveFilter: boolean | null = null;
  searchDebounce: ReturnType<typeof setTimeout> | null = null;

  readonly jobOptions = signal<JobListDto[]>([]);
  readonly ouOptions = signal<OrganizationalUnitListDto[]>([]);
  readonly positionOptions = signal<PositionListDto[]>([]);

  readonly showModal = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly modalError = signal<string | null>(null);

  form: CreatePositionRequest & { reportsToPositionId?: string | null } = {
    code: '',
    jobId: '',
    organizationalUnitId: '',
    isVacant: false,
    reportsToPositionId: null,
  };

  readonly showConfirm = signal(false);
  readonly toDelete = signal<PositionListDto | null>(null);

  canCreate = () => this.auth.hasPermission(PermissionCodes.position.create);
  canEdit = () => this.auth.hasPermission(PermissionCodes.position.edit);
  canDelete = () => this.auth.hasPermission(PermissionCodes.position.delete);

  breadcrumbs = computed(() => [{ label: this.translate.instant('nav.positions') }]);

  ngOnInit(): void {
    this.loadJobOptions();
    this.loadOuOptions();
    this.loadPositionOptions();
    this.load();
  }

  confirmDelete(p: PositionListDto): void {
    this.toDelete.set(p);
    this.showConfirm.set(true);
  }

  cancelDelete(): void {
    this.showConfirm.set(false);
    this.toDelete.set(null);
  }

  deleteConfirmMessage = computed(() => {
    const p = this.toDelete();
    if (!p) return '';
    return this.translate.instant('dialog.confirmDelete');
  });

  doDelete(): void {
    const target = this.toDelete();
    if (!target) return;
    this.showConfirm.set(false);
    this.api.delete(target.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success(this.translate.instant('common.deleted') || this.translate.instant('common.saved'));
          this.load();
        } else {
          this.toast.error(res.message || this.translate.instant('error.generic'));
        }
      },
      error: (err) => {
        this.toast.error(err.error?.message ?? err.message ?? this.translate.instant('error.generic'));
      },
    });
  }

  loadJobOptions(): void {
    this.jobApi.getPaged({ page: 1, pageSize: 500 }).subscribe({
      next: (res) => {
        if (res.success && res.data) this.jobOptions.set(res.data.items);
      },
    });
  }

  loadOuOptions(): void {
    this.orgApi.getDefault().subscribe({
      next: (res) => {
        const defaultOrgId = res.success && res.data?.id ? res.data.id : undefined;
        this.ouApi.getPaged({ page: 1, pageSize: 5000, organizationId: defaultOrgId, rootOnly: false, sortBy: 'type' }).subscribe({
          next: (r) => {
            if (r.success && r.data) this.ouOptions.set(r.data.items);
          },
        });
      },
    });
  }

  loadPositionOptions(): void {
    this.api.getPaged({ page: 1, pageSize: 500 }).subscribe({
      next: (res) => {
        if (res.success && res.data) this.positionOptions.set(res.data.items);
      },
    });
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getPaged({
      page: this.page(),
      pageSize: this.pageSize,
      search: this.search || undefined,
      organizationalUnitId: this.organizationalUnitIdFilter ?? undefined,
      jobId: this.jobIdFilter ?? undefined,
      isActive: this.isActiveFilter ?? undefined,
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
    this.organizationalUnitIdFilter = null;
    this.jobIdFilter = null;
    this.isActiveFilter = null;
    this.page.set(1);
    this.load();
  }

  onFormOrganizationalUnitChange(ouId: string | null): void {
    if (!ouId || !this.form.reportsToPositionId) return;
    const selectedPos = this.positionOptions().find(p => p.id === this.form.reportsToPositionId);
    if (selectedPos && selectedPos.organizationalUnitId !== ouId) {
      this.form = { ...this.form, reportsToPositionId: null };
    }
  }

  getReportsToPositionLabel(position: PositionListDto): string {
    if (!position.reportsToPositionId) return '—';
    const reportsTo = this.positionOptions().find(p => p.id === position.reportsToPositionId);
    if (reportsTo) {
      const title = this.getLocalizedJobTitleForPosition(reportsTo);
      return `${reportsTo.code} (${title})`;
    }
    return position.reportsToPositionCode ?? '—';
  }

  /** Job list API includes Arabic titles; position list often only has English — resolve via jobOptions when possible. */
  getLocalizedJobTitleForPosition(p: PositionListDto): string {
    const job = this.jobOptions().find(j => j.id === p.jobId);
    if (job) return this.getLocalizedText(job.titleAr, job.titleEn);
    return this.getLocalizedText(p.jobTitleAr, p.jobTitleEn);
  }

  getLocalizedText(ar?: string | null, en?: string | null): string {
    const currentLang = (this.translate.currentLang || this.translate.getDefaultLang() || 'en').toLowerCase();
    const prefersArabic = currentLang.startsWith('ar');
    const arText = ar?.trim() ?? '';
    const enText = en?.trim() ?? '';
    if (prefersArabic) return arText || enText || '—';
    return enText || arText || '—';
  }

  getLocalizedOuName(ouId?: string | null, fallbackAr?: string | null, fallbackEn?: string | null): string {
    const ou = ouId ? this.ouOptions().find(x => x.id === ouId) : null;
    if (ou) return this.getLocalizedText(ou.nameAr, ou.nameEn);
    return this.getLocalizedText(fallbackAr, fallbackEn);
  }

  prevPage(): void { this.page.update(p => Math.max(1, p - 1)); this.load(); }
  nextPage(): void { this.page.update(p => p + 1); this.load(); }

  openCreate(): void {
    this.editingId.set(null);
    this.form = { code: '', jobId: '', organizationalUnitId: '', isVacant: false, reportsToPositionId: null };
    this.modalError.set(null);
    this.showModal.set(true);
  }

  openEdit(p: PositionListDto): void {
    this.editingId.set(p.id);
    this.form = {
      code: p.code,
      jobId: p.jobId,
      organizationalUnitId: p.organizationalUnitId,
      isVacant: p.isVacant,
      reportsToPositionId: p.reportsToPositionId ?? null,
    };
    this.modalError.set(null);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingId.set(null);
  }

  save(): void {
    this.modalError.set(null);
    const id = this.editingId();
    const payload: CreatePositionRequest | UpdatePositionRequest = {
      code: this.form.code,
      jobId: this.form.jobId,
      organizationalUnitId: this.form.organizationalUnitId,
      isVacant: this.form.isVacant,
      reportsToPositionId: this.form.reportsToPositionId ?? undefined,
    };
    if (id) {
      this.saving.set(true);
      this.api.update(id, payload as UpdatePositionRequest).subscribe({
        next: () => { this.saving.set(false); this.closeModal(); this.load(); this.loadPositionOptions(); },
        error: (err) => { this.saving.set(false); this.modalError.set(err.error?.errors?.[0] ?? err.error?.message ?? 'Error'); },
      });
    } else {
      if (!this.form.code?.trim() || !this.form.jobId || !this.form.organizationalUnitId) {
        this.modalError.set(this.translate.instant('validation.required'));
        return;
      }
      this.saving.set(true);
      this.api.create(payload as CreatePositionRequest).subscribe({
        next: () => { this.saving.set(false); this.closeModal(); this.load(); this.loadPositionOptions(); },
        error: (err) => { this.saving.set(false); this.modalError.set(err.error?.errors?.[0] ?? err.error?.message ?? 'Error'); },
      });
    }
  }

  setStatus(p: PositionListDto): void {
    this.api.setStatus(p.id, { isActive: !p.isActive }).subscribe({
      next: () => this.load(),
      error: (err) => this.error.set(err.error?.message ?? err.message ?? 'Failed to set status'),
    });
  }

  toggleVacant(p: PositionListDto): void {
    const payload: UpdatePositionRequest = {
      code: p.code,
      jobId: p.jobId,
      organizationalUnitId: p.organizationalUnitId,
      isVacant: !p.isVacant,
      reportsToPositionId: p.reportsToPositionId ?? undefined,
    };
    this.api.update(p.id, payload).subscribe({
      next: () => {
        this.toast.success(this.translate.instant(p.isVacant ? 'positions.setOccupied' : 'positions.setVacant'));
        this.load();
        this.loadPositionOptions();
      },
      error: (err) => this.toast.error(err.error?.message ?? err.message ?? this.translate.instant('error.generic')),
    });
  }
}
