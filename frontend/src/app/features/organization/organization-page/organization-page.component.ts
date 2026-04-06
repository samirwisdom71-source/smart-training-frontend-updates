import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { OrganizationsApiService } from '../../../core/api/organizations/organizations-api.service';
import { OrganizationalUnitsApiService } from '../../../core/api/organizational-units/organizational-units-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionCodes } from '../../../core/auth/permissions';
import type {
  OrganizationListDto,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  SetStatusRequest as OrgSetStatusRequest,
} from '../../../core/api/organizations/organizations-api.models';
import type {
  OrganizationalUnitListDto,
  CreateOrganizationalUnitRequest,
  UpdateOrganizationalUnitRequest,
  OrganizationalUnitType,
} from '../../../core/api/organizational-units/organizational-units-api.models';
import type { PagedResult } from '../../../core/models/api-response';
import { ToastService } from '../../../core/toast/toast.service';

const OU_TYPES: OrganizationalUnitType[] = ['Sector', 'Department', 'Section', 'Unit', 'Office'];

@Component({
  selector: 'app-organization-page',
  standalone: true,
  imports: [FormsModule, TranslateModule, PageShellComponent, ConfirmDialogComponent],
  template: `
    <app-page-shell [title]="'nav.organization' | translate" [breadcrumbs]="breadcrumbs()">
      <div class="actions-row" actions>
        @if (canCreate()) {
          <button type="button" class="ds-btn ds-btn--primary ds-btn--sm" (click)="openOrgCreate()">
            {{ 'common.add' | translate }} {{ 'table.organization' | translate }}
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
              <div class="ds-filterfield__label">{{ 'table.status' | translate }}</div>
              <select class="ds-input filter-select ds-filterfield__control" [(ngModel)]="isActiveFilter" (ngModelChange)="onFilterChange()">
                <option [ngValue]="null">{{ 'common.all' | translate }}</option>
                <option [ngValue]="true">{{ 'status.active' | translate }}</option>
                <option [ngValue]="false">{{ 'status.inactive' | translate }}</option>
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
          <button type="button" class="ds-btn ds-btn--secondary ds-btn--sm" (click)="loadOrgs()">{{ 'empty.tryAgain' | translate }}</button>
        </div>
      } @else if (!orgData()?.items?.length) {
        <div class="ds-empty">
          <p class="ds-empty__title">{{ 'table.noRows' | translate }}</p>
          @if (canCreate()) {
            <button type="button" class="ds-btn ds-btn--primary ds-btn--sm" (click)="openOrgCreate()">{{ 'common.add' | translate }}</button>
          }
        </div>
      } @else {
        <div class="ds-table-wrap">
          <table class="ds-table">
            <thead>
              <tr>
                <th>{{ 'table.code' | translate }}</th>
                <th>{{ 'table.name' | translate }}</th>
                <th>{{ 'table.status' | translate }}</th>
                <th style="width: 100px;">{{ 'org.defaultOrg' | translate }}</th>
                <th class="cell-actions" style="width: 48px;" aria-hidden="true"></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (o of orgData()!.items; track o.id) {
                <tr [class.row-selected]="selectedOrgId() === o.id">
                  <td>{{ o.code }}</td>
                  <td>{{ getLocalizedName(o.nameAr, o.nameEn) }}</td>
                  <td><span class="ds-badge" [class.ds-badge--success]="o.isActive" [class.ds-badge--neutral]="!o.isActive">{{ o.isActive ? ('status.active' | translate) : ('status.inactive' | translate) }}</span></td>
                  <td>
                    @if (o.isDefault) {
                      <span class="default-star default-star--on" [title]="'org.defaultOrg' | translate" aria-label="'org.defaultOrg' | translate">
                        <svg class="default-star__icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/></svg>
                      </span>
                    } @else if (canEdit()) {
                      <button type="button" class="default-star default-star--off" (click)="setAsDefault(o); $event.stopPropagation()" [title]="'org.setAsDefault' | translate" [attr.aria-label]="'org.setAsDefault' | translate">
                        <svg class="default-star__icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
                      </button>
                    } @else {
                      <span>—</span>
                    }
                  </td>
                  <td class="cell-actions">
                    <button
                      type="button"
                      class="ds-btn ds-btn--ghost ds-btn--icon ds-btn--view-units"
                      (click)="selectOrg(o.id)"
                      [attr.aria-label]="'org.viewUnits' | translate"
                      [title]="'org.viewUnits' | translate"
                    >
                      <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6-6-6z" fill="currentColor"/>
                      </svg>
                    </button>
                  </td>
                  <td class="cell-actions">
                    @if (canEdit()) {
                      <button
                        type="button"
                        class="ds-btn ds-btn--ghost ds-btn--icon"
                        (click)="openOrgEdit(o); $event.stopPropagation()"
                        [attr.aria-label]="'common.edit' | translate"
                        [title]="'common.edit' | translate"
                      >
                        <svg class="icon-svg" viewBox="0 0 24 24">
                          <path
                            d="M4 17.5V20h2.5L17 9.5 14.5 7 4 17.5Z"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.6"
                            stroke-linejoin="round"
                          />
                          <path
                            d="M13.5 6.5 16 4l3 3-2.5 2.5"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.6"
                            stroke-linejoin="round"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        class="ds-btn ds-btn--ghost ds-btn--icon"
                        (click)="setOrgStatus(o); $event.stopPropagation()"
                        [attr.aria-label]="'org.setStatus' | translate"
                        [title]="'org.setStatus' | translate"
                      >
                        <svg class="icon-svg" viewBox="0 0 24 24">
                          <path
                            d="M5 4h14v4.5A6.5 6.5 0 0 1 12.5 19H5V4Z"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.6"
                            stroke-linejoin="round"
                          />
                          <path
                            d="M9 9h6"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.6"
                            stroke-linecap="round"
                          />
                        </svg>
                      </button>
                      @if (canDelete()) {
                        <button
                          type="button"
                          class="ds-btn ds-btn--ghost ds-btn--icon ds-btn--danger"
                          (click)="confirmDeleteOrg(o); $event.stopPropagation()"
                          [attr.aria-label]="'common.delete' | translate"
                          [title]="'common.delete' | translate"
                        >
                          <svg class="icon-svg" viewBox="0 0 24 24">
                            <path
                              d="M6 19V7h12v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2Z"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="1.6"
                            />
                            <path
                              d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M4 7h16"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="1.6"
                              stroke-linecap="round"
                            />
                          </svg>
                        </button>
                      }
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="pagination">
          <button type="button" class="ds-btn ds-btn--ghost ds-btn--sm" [disabled]="!orgData()?.hasPreviousPage" (click)="prevOrgPage()">{{ 'common.previous' | translate }}</button>
          <span class="pagination-info">{{ 'common.page' | translate }} {{ orgPage() }} {{ 'common.of' | translate }} {{ orgData()?.totalPages ?? 1 }}</span>
          <button type="button" class="ds-btn ds-btn--ghost ds-btn--sm" [disabled]="!orgData()?.hasNextPage" (click)="nextOrgPage()">{{ 'common.next' | translate }}</button>
        </div>
      }

      @if (selectedOrgId()) {
        <section class="section-ou">
          <h2 class="section-ou__title">{{ 'org.organizationalUnits' | translate }}</h2>
          @if (canCreate()) {
            <button type="button" class="ds-btn ds-btn--primary ds-btn--sm section-ou__add" (click)="openOuCreate()">{{ 'common.add' | translate }} {{ 'table.organizationalUnit' | translate }}</button>
          }
          @if (ouLoading() || ouOptionsLoading()) {
            <div class="table-loading">
              <div class="ds-skeleton" style="height: 48px; margin-bottom: 8px;"></div>
              <div class="ds-skeleton" style="height: 48px;"></div>
            </div>
          } @else if (!ouOptions().length && !ouOptionsLoading()) {
            <div class="ds-empty">
              <p class="ds-empty__title">{{ 'table.noRows' | translate }}</p>
              @if (canCreate()) {
                <button type="button" class="ds-btn ds-btn--primary ds-btn--sm" (click)="openOuCreate()">{{ 'common.add' | translate }}</button>
              }
            </div>
          } @else {
            <div class="ds-table-wrap">
              <table class="ds-table ds-table--ou-tree">
                <thead>
                  <tr>
                    <th class="ou-tree__th-toggle" aria-hidden="true"></th>
                    <th>{{ 'table.code' | translate }}</th>
                    <th>{{ 'table.name' | translate }}</th>
                    <th>{{ 'table.type' | translate }}</th>
                    <th>{{ 'table.parentUnit' | translate }}</th>
                    <th>{{ 'table.displayOrder' | translate }}</th>
                    <th>{{ 'table.status' | translate }}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of ouTreeRows(); track row.ou.id) {
                    <tr
                      class="ou-tree__row"
                      [class.ou-tree__row--root]="row.depth === 0"
                      [class.ou-tree__row--child]="row.depth > 0"
                      [style.--ou-depth]="row.depth"
                    >
                      <td class="ou-tree__td-toggle">
                        @if (hasOuChildren(row.ou.id)) {
                          <button type="button" class="ou-tree__toggler" (click)="toggleOuExpanded(row.ou.id); $event.stopPropagation()" [class.ou-tree__toggler--open]="isOuExpanded(row.ou.id)" [attr.aria-expanded]="isOuExpanded(row.ou.id)" [attr.aria-label]="isOuExpanded(row.ou.id) ? ('common.collapse' | translate) : ('common.expand' | translate)">
                            <svg class="ou-tree__chevron" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M9 18l6-6-6-6"/></svg>
                          </button>
                        } @else {
                          <span class="ou-tree__toggler-spacer" aria-hidden="true"></span>
                        }
                      </td>
                      <td class="ou-tree__td-code">{{ row.ou.code }}</td>
                      <td>{{ getLocalizedName(row.ou.nameAr, row.ou.nameEn) }}</td>
                      <td>{{ ('org.ouType.' + row.ou.type) | translate }}</td>
                      <td>{{ row.ou.parentId ? (getParentName(row.ou.parentId) || row.ou.parentId) : '—' }}</td>
                      <td>{{ row.ou.displayOrder }}</td>
                      <td><span class="ds-badge" [class.ds-badge--success]="row.ou.isActive" [class.ds-badge--neutral]="!row.ou.isActive">{{ row.ou.isActive ? ('status.active' | translate) : ('status.inactive' | translate) }}</span></td>
                      <td class="cell-actions">
                        @if (canEdit()) {
                          <button
                            type="button"
                            class="ds-btn ds-btn--ghost ds-btn--icon"
                            (click)="openOuEdit(row.ou)"
                            [attr.aria-label]="'common.edit' | translate"
                            [title]="'common.edit' | translate"
                          >
                            <svg class="icon-svg" viewBox="0 0 24 24">
                              <path
                                d="M4 17.5V20h2.5L17 9.5 14.5 7 4 17.5Z"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="1.6"
                                stroke-linejoin="round"
                              />
                              <path
                                d="M13.5 6.5 16 4l3 3-2.5 2.5"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="1.6"
                                stroke-linejoin="round"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            class="ds-btn ds-btn--ghost ds-btn--icon"
                            (click)="setOuStatus(row.ou)"
                            [attr.aria-label]="'org.setStatus' | translate"
                            [title]="'org.setStatus' | translate"
                          >
                            <svg class="icon-svg" viewBox="0 0 24 24">
                              <path
                                d="M5 4h14v4.5A6.5 6.5 0 0 1 12.5 19H5V4Z"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="1.6"
                                stroke-linejoin="round"
                              />
                              <path
                                d="M9 9h6"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="1.6"
                                stroke-linecap="round"
                              />
                            </svg>
                          </button>
                          @if (canDelete()) {
                            <button
                              type="button"
                              class="ds-btn ds-btn--ghost ds-btn--icon ds-btn--danger"
                              (click)="confirmDeleteOu(row.ou)"
                              [attr.aria-label]="'common.delete' | translate"
                              [title]="'common.delete' | translate"
                            >
                              <svg class="icon-svg" viewBox="0 0 24 24">
                                <path
                                  d="M6 19V7h12v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2Z"
                                  fill="none"
                                  stroke="currentColor"
                                  stroke-width="1.6"
                                />
                                <path
                                  d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M4 7h16"
                                  fill="none"
                                  stroke="currentColor"
                                  stroke-width="1.6"
                                  stroke-linecap="round"
                                />
                              </svg>
                            </button>
                          }
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </section>
      }
    </app-page-shell>

    @if (showOrgModal()) {
      <div class="modal-overlay" (click)="closeOrgModal()">
        <div class="modal-drawer ds-card" (click)="$event.stopPropagation()">
          <h3 class="modal-drawer__title">{{ editingOrgId() ? ('common.edit' | translate) : ('common.add' | translate) }} {{ 'table.organization' | translate }}</h3>
          @if (modalError()) {
            <p class="ds-field-error">{{ modalError() }}</p>
          }
          <form (ngSubmit)="saveOrg()">
            <div class="form-group">
              <label class="ds-label">{{ 'table.code' | translate }}</label>
              <input type="text" class="ds-input" [(ngModel)]="orgForm.code" name="orgCode" />
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'table.nameEn' | translate }}</label>
              <input type="text" class="ds-input" [(ngModel)]="orgForm.nameEn" name="orgNameEn" />
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'table.nameAr' | translate }}</label>
              <input type="text" class="ds-input" [(ngModel)]="orgForm.nameAr" name="orgNameAr" />
            </div>
            <div class="modal-drawer__actions">
              <button type="button" class="ds-btn ds-btn--secondary" (click)="closeOrgModal()">{{ 'common.cancel' | translate }}</button>
              <button type="submit" class="ds-btn ds-btn--primary" [disabled]="saving()">{{ saving() ? ('common.loading' | translate) : ('common.save' | translate) }}</button>
            </div>
          </form>
        </div>
      </div>
    }

    @if (showOuModal()) {
      <div class="modal-overlay" (click)="closeOuModal()">
        <div class="modal-drawer ds-card" (click)="$event.stopPropagation()">
          <h3 class="modal-drawer__title">{{ editingOuId() ? ('common.edit' | translate) : ('common.add' | translate) }} {{ 'table.organizationalUnit' | translate }}</h3>
          @if (modalOuError()) {
            <p class="ds-field-error">{{ modalOuError() }}</p>
          }
          <form (ngSubmit)="saveOu()">
            <div class="form-group">
              <label class="ds-label">{{ 'table.code' | translate }}</label>
              <input type="text" class="ds-input" [(ngModel)]="ouForm.code" name="ouCode" />
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'table.nameEn' | translate }}</label>
              <input type="text" class="ds-input" [(ngModel)]="ouForm.nameEn" name="ouNameEn" />
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'table.nameAr' | translate }}</label>
              <input type="text" class="ds-input" [(ngModel)]="ouForm.nameAr" name="ouNameAr" />
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'table.type' | translate }}</label>
              <select class="ds-input" [(ngModel)]="ouForm.type" name="ouType">
                @for (t of ouTypes; track t) {
                  <option [value]="t">{{ 'org.ouType.' + t | translate }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'org.parentUnitLabel' | translate }}</label>
              <p class="ds-hint" aria-hidden="true">{{ 'org.parentUnitHint' | translate }}</p>
              <select class="ds-input" [(ngModel)]="ouForm.parentId" name="ouParentId">
                <option [ngValue]="null">{{ 'org.parentUnitNone' | translate }}</option>
                @for (ou of ouOptions(); track ou.id) {
                  @if (ou.id !== editingOuId()) {
                    <option [value]="ou.id">{{ getLocalizedName(ou.nameAr, ou.nameEn) }}</option>
                  }
                }
              </select>
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'table.displayOrder' | translate }}</label>
              <input type="number" class="ds-input" [(ngModel)]="ouForm.displayOrder" name="ouDisplayOrder" min="0" />
            </div>
            <div class="modal-drawer__actions">
              <button type="button" class="ds-btn ds-btn--secondary" (click)="closeOuModal()">{{ 'common.cancel' | translate }}</button>
              <button type="submit" class="ds-btn ds-btn--primary" [disabled]="savingOu()">{{ savingOu() ? ('common.loading' | translate) : ('common.save' | translate) }}</button>
            </div>
          </form>
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
    .filter-select { max-width: 160px; }
    .table-loading { padding: var(--space-md) 0; }
    .cell-actions { text-align: end; }
    .row-selected { background: var(--color-surface-alt, rgba(0,0,0,.03)); }
    .ds-btn--view-units { color: var(--color-primary); }
    .ds-btn--view-units:hover { background: var(--color-primary); color: var(--color-primary-inverse, #fff); }
    .default-star { display: inline-flex; align-items: center; justify-content: center; padding: 4px; border: none; background: none; cursor: default; }
    .default-star--off { cursor: pointer; color: var(--color-text-muted, #94a3b8); }
    .default-star--off:hover { color: var(--color-text-secondary, #64748b); }
    .default-star--on { color: #eab308; }
    .default-star__icon { width: 20px; height: 20px; display: block; }
    .ou-tree__th-toggle { width: 36px; padding-left: var(--space-sm); vertical-align: middle; }
    .ou-tree__td-toggle { width: 36px; padding-left: var(--space-sm); vertical-align: middle; }
    .ou-tree__row { border-bottom: 1px solid var(--color-border, #e2e8f0); transition: background-color 0.18s ease; }
    .ou-tree__row:hover { background: rgba(37, 99, 235, 0.04); }
    .ou-tree__row--root {
      background: rgba(15, 23, 42, 0.04);
      font-weight: 600;
    }
    .ou-tree__row--root td {
      border-top: 2px solid rgba(15, 23, 42, 0.1);
      border-bottom: 1px solid rgba(15, 23, 42, 0.12);
    }
    .ou-tree__row--child { background: var(--color-surface-alt, rgba(15, 23, 42, 0.02)); }
    .ou-tree__row--child td { color: var(--color-text-secondary, #475569); }
    .ou-tree__row--child .ou-tree__td-code { font-weight: 600; color: var(--color-text, #0f172a); }
    .ou-tree__row--root + .ou-tree__row--root td { border-top: 3px solid var(--color-border, #cbd5e1); }
    .ou-tree__toggler { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; padding: 0; border: none; background: none; border-radius: 4px; color: var(--color-text-secondary); cursor: pointer; }
    .ou-tree__toggler:hover { background: var(--color-surface-alt, rgba(0,0,0,.04)); color: var(--color-primary); }
    .ou-tree__chevron { width: 18px; height: 18px; transition: transform 0.2s ease; }
    .ou-tree__toggler--open .ou-tree__chevron { transform: rotate(90deg); }
    .ou-tree__toggler-spacer { display: inline-block; width: 28px; height: 28px; }
    .ou-tree__row .ou-tree__td-code {
      position: relative;
      padding-left: calc(var(--space-md) + (var(--ou-depth, 0) * 28px));
    }
    .ou-tree__row--child .ou-tree__td-code::before {
      content: '';
      position: absolute;
      left: calc(var(--space-sm) + (var(--ou-depth, 0) * 28px));
      top: 8px;
      bottom: 8px;
      width: 3px;
      border-radius: 999px;
      background: var(--color-primary, #2563eb);
      opacity: 0.45;
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.7);
    }
    .pagination { display: flex; align-items: center; gap: var(--space-md); margin-top: var(--space-lg); flex-wrap: wrap; }
    .pagination-info { font-size: var(--text-body-sm); color: var(--color-text-secondary); }
    .section-ou { margin-top: var(--space-xl); padding-top: var(--space-lg); border-top: 1px solid var(--color-border); }
    .section-ou__title { font-size: var(--text-h2); font-weight: 600; margin: 0 0 var(--space-md); }
    .section-ou__add { margin-bottom: var(--space-md); }
    .modal-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(15,23,42,0.5); display: flex; align-items: center; justify-content: center; padding: var(--space-lg); }
    .modal-drawer { max-width: 440px; width: 100%; max-height: 90vh; overflow: auto; }
    .modal-drawer__title { font-size: var(--text-h1); font-weight: 600; margin: 0 0 var(--space-md); }
    .modal-drawer form .form-group { margin-bottom: var(--space-md); }
    .ds-hint { font-size: var(--text-body-sm, 0.875rem); color: var(--color-text-secondary, #64748b); margin: 0 0 var(--space-xs); }
    .modal-drawer__actions { display: flex; justify-content: flex-end; gap: var(--space-sm); margin-top: var(--space-lg); }
  `]
})
export class OrganizationPageComponent implements OnInit {
  private readonly orgApi = inject(OrganizationsApiService);
  private readonly ouApi = inject(OrganizationalUnitsApiService);
  private readonly auth = inject(AuthService);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(ToastService);

  readonly orgData = signal<PagedResult<OrganizationListDto> | null>(null);
  readonly ouData = signal<PagedResult<OrganizationalUnitListDto> | null>(null);
  readonly loading = signal(false);
  readonly ouLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly orgPage = signal(1);
  readonly ouPage = signal(1);
  readonly pageSize = 10;
  search = '';
  isActiveFilter: boolean | null = null;
  searchDebounce: ReturnType<typeof setTimeout> | null = null;

  readonly selectedOrgId = signal<string | null>(null);
  readonly showOrgModal = signal(false);
  readonly showOuModal = signal(false);
  readonly editingOrgId = signal<string | null>(null);
  readonly editingOuId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly savingOu = signal(false);
  readonly modalError = signal<string | null>(null);
  readonly modalOuError = signal<string | null>(null);
  readonly deleting = signal(false);

  readonly showConfirm = signal(false);
  readonly deleteTarget = signal<{ kind: 'org' | 'ou'; id: string; name: string } | null>(null);

  orgForm: CreateOrganizationRequest = { code: '', nameEn: '', nameAr: '' };
  ouForm: CreateOrganizationalUnitRequest & { parentId?: string | null } = {
    code: '',
    nameEn: '',
    nameAr: '',
    type: 'Department',
    organizationId: '',
    parentId: null,
    managerEmployeeId: null,
    displayOrder: 0,
  };

  ouTypes = OU_TYPES;
  readonly ouOptions = signal<OrganizationalUnitListDto[]>([]);
  readonly ouOptionsLoading = signal(false);
  readonly expandedOuIds = signal<Set<string>>(new Set());

  readonly ouTreeRows = computed(() => {
    const all = this.ouOptions();
    const expanded = this.expandedOuIds();
    const out: { ou: OrganizationalUnitListDto; depth: number }[] = [];
    const roots = all.filter(ou => !ou.parentId).sort((a, b) => a.displayOrder - b.displayOrder || a.nameEn.localeCompare(b.nameEn));
    const add = (ou: OrganizationalUnitListDto, depth: number) => {
      out.push({ ou, depth });
      if (expanded.has(ou.id)) {
        const children = all.filter(x => x.parentId === ou.id).sort((a, b) => a.displayOrder - b.displayOrder || a.nameEn.localeCompare(b.nameEn));
        children.forEach(c => add(c, depth + 1));
      }
    };
    roots.forEach(r => add(r, 0));
    return out;
  });

  canCreate = () => this.auth.hasPermission(PermissionCodes.organization.create);
  canEdit = () => this.auth.hasPermission(PermissionCodes.organization.edit);
  canDelete = () => this.auth.hasPermission(PermissionCodes.organization.delete);

  breadcrumbs = computed(() => [{ label: this.translate.instant('nav.organization') }]);

  constructor() {
    effect(() => {
      const id = this.selectedOrgId();
      if (id) {
        this.expandedOuIds.set(new Set());
        this.loadOus();
        this.loadOuOptions(id);
      } else {
        this.ouData.set(null);
        this.ouOptions.set([]);
      }
    });
  }

  ngOnInit(): void {
    this.loadOrgs();
  }

  confirmDeleteOrg(org: OrganizationListDto): void {
    this.deleteTarget.set({ kind: 'org', id: org.id, name: org.nameAr || org.nameEn });
    this.showConfirm.set(true);
  }

  confirmDeleteOu(ou: OrganizationalUnitListDto): void {
    this.deleteTarget.set({ kind: 'ou', id: ou.id, name: ou.nameAr || ou.nameEn });
    this.showConfirm.set(true);
  }

  cancelDelete(): void {
    this.showConfirm.set(false);
    this.deleteTarget.set(null);
  }

  deleteConfirmMessage = computed(() => {
    const target = this.deleteTarget();
    if (!target) return '';
    return this.translate.instant('dialog.confirmDelete');
  });

  doDelete(): void {
    const target = this.deleteTarget();
    if (!target) return;
    this.showConfirm.set(false);
    this.deleting.set(true);

    const obs =
      target.kind === 'org'
        ? this.orgApi.delete(target.id)
        : this.ouApi.delete(target.id);

    obs.subscribe({
      next: (res) => {
        this.deleting.set(false);
        if (res.success) {
          this.toast.success(this.translate.instant('common.deleted'));
          if (target.kind === 'org') {
            this.loadOrgs();
            if (this.selectedOrgId() === target.id) {
              this.selectedOrgId.set(null);
            }
          } else {
            this.loadOus();
            if (this.selectedOrgId()) {
              this.loadOuOptions(this.selectedOrgId()!);
            }
          }
        } else {
          this.toast.error(res.message || this.translate.instant('dialog.error'));
        }
      },
      error: (err) => {
        this.deleting.set(false);
        this.toast.error(err.error?.message ?? err.message ?? this.translate.instant('dialog.error'));
      },
    });
  }

  loadOrgs(): void {
    this.loading.set(true);
    this.error.set(null);
    this.orgApi.getPaged({
      page: this.orgPage(),
      pageSize: this.pageSize,
      search: this.search || undefined,
      isActive: this.isActiveFilter ?? undefined,
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.orgData.set(res.data);
          if (!this.selectedOrgId() && res.data.items?.length) {
            const defaultOrg = res.data.items.find((o: OrganizationListDto) => o.isDefault) ?? res.data.items[0];
            if (defaultOrg) this.selectedOrgId.set(defaultOrg.id);
          }
        } else this.error.set(res.message ?? 'Failed to load');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? err.message ?? 'Failed to load');
      },
    });
  }

  loadOus(): void {
    const orgId = this.selectedOrgId();
    if (!orgId) return;
    this.ouLoading.set(true);
    this.ouApi.getPaged({
      page: this.ouPage(),
      pageSize: this.pageSize,
      organizationId: orgId,
      rootOnly: false,
    }).subscribe({
      next: (res) => {
        this.ouLoading.set(false);
        if (res.success && res.data) this.ouData.set(res.data);
      },
      error: () => this.ouLoading.set(false),
    });
  }

  loadOuOptions(organizationId: string): void {
    this.ouOptionsLoading.set(true);
    this.ouApi.getPaged({ page: 1, pageSize: 500, organizationId, rootOnly: false }).subscribe({
      next: (res) => {
        this.ouOptionsLoading.set(false);
        if (res.success && res.data) this.ouOptions.set(res.data.items);
      },
      error: () => this.ouOptionsLoading.set(false),
    });
  }

  hasOuChildren(ouId: string): boolean {
    return this.ouOptions().some(ou => ou.parentId === ouId);
  }

  isOuExpanded(ouId: string): boolean {
    return this.expandedOuIds().has(ouId);
  }

  toggleOuExpanded(ouId: string): void {
    this.expandedOuIds.update(s => {
      // Accordion behavior: opening one closes others.
      if (s.has(ouId)) return new Set();
      return new Set([ouId]);
    });
  }

  onSearchChange(): void {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => { this.orgPage.set(1); this.loadOrgs(); }, 300);
  }

  onFilterChange(): void {
    this.orgPage.set(1);
    this.loadOrgs();
  }

  clearFilters(): void {
    this.search = '';
    this.isActiveFilter = null;
    this.orgPage.set(1);
    this.loadOrgs();
  }

  selectOrg(id: string): void {
    this.selectedOrgId.set(id);
    this.ouPage.set(1);
  }

  prevOrgPage(): void { this.orgPage.update(p => Math.max(1, p - 1)); this.loadOrgs(); }
  nextOrgPage(): void { this.orgPage.update(p => p + 1); this.loadOrgs(); }
  prevOuPage(): void { this.ouPage.update(p => Math.max(1, p - 1)); this.loadOus(); }
  nextOuPage(): void { this.ouPage.update(p => p + 1); this.loadOus(); }

  openOrgCreate(): void {
    this.editingOrgId.set(null);
    this.orgForm = { code: '', nameEn: '', nameAr: '' };
    this.modalError.set(null);
    this.showOrgModal.set(true);
  }

  openOrgEdit(o: OrganizationListDto): void {
    this.editingOrgId.set(o.id);
    this.orgForm = { code: o.code, nameEn: o.nameEn, nameAr: o.nameAr };
    this.modalError.set(null);
    this.showOrgModal.set(true);
  }

  closeOrgModal(): void {
    this.showOrgModal.set(false);
    this.editingOrgId.set(null);
  }

  saveOrg(): void {
    this.modalError.set(null);
    const id = this.editingOrgId();
    if (id) {
      this.saving.set(true);
      this.orgApi.update(id, this.orgForm as UpdateOrganizationRequest).subscribe({
        next: () => { this.saving.set(false); this.closeOrgModal(); this.loadOrgs(); },
        error: (err) => { this.saving.set(false); this.modalError.set(err.error?.errors?.[0] ?? err.error?.message ?? 'Error'); },
      });
    } else {
      if (!this.orgForm.code?.trim() || !this.orgForm.nameEn?.trim()) {
        this.modalError.set(this.translate.instant('validation.required'));
        return;
      }
      this.saving.set(true);
      this.orgApi.create(this.orgForm).subscribe({
        next: () => { this.saving.set(false); this.closeOrgModal(); this.loadOrgs(); },
        error: (err) => { this.saving.set(false); this.modalError.set(err.error?.errors?.[0] ?? err.error?.message ?? 'Error'); },
      });
    }
  }

  setOrgStatus(o: OrganizationListDto): void {
    const body: OrgSetStatusRequest = { isActive: !o.isActive };
    this.orgApi.setStatus(o.id, body).subscribe({
      next: () => this.loadOrgs(),
      error: (err) => this.error.set(err.error?.message ?? err.message ?? 'Failed to set status'),
    });
  }

  setAsDefault(o: OrganizationListDto): void {
    this.orgApi.setDefault(o.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success(this.translate.instant('common.saved'));
          this.loadOrgs();
        } else {
          this.toast.error(res.message ?? this.translate.instant('dialog.error'));
        }
      },
      error: (err) => this.toast.error(err.error?.message ?? err.message ?? this.translate.instant('dialog.error')),
    });
  }

  openOuCreate(): void {
    const orgId = this.selectedOrgId();
    if (!orgId) return;
    this.editingOuId.set(null);
    this.ouForm = {
      code: '',
      nameEn: '',
      nameAr: '',
      type: 'Department',
      organizationId: orgId,
      parentId: null,
      managerEmployeeId: null,
      displayOrder: 0,
    };
    this.modalOuError.set(null);
    this.showOuModal.set(true);
  }

  openOuEdit(ou: OrganizationalUnitListDto): void {
    this.editingOuId.set(ou.id);
    this.ouForm = {
      code: ou.code,
      nameEn: ou.nameEn,
      nameAr: ou.nameAr,
      type: ou.type as OrganizationalUnitType,
      organizationId: ou.organizationId,
      parentId: ou.parentId,
      managerEmployeeId: ou.managerEmployeeId,
      displayOrder: ou.displayOrder,
    };
    this.modalOuError.set(null);
    this.showOuModal.set(true);
  }

  closeOuModal(): void {
    this.showOuModal.set(false);
    this.editingOuId.set(null);
  }

  saveOu(): void {
    this.modalOuError.set(null);
    const id = this.editingOuId();
    const orgId = this.selectedOrgId();
    if (!orgId) return;
    const payload = {
      code: this.ouForm.code,
      nameEn: this.ouForm.nameEn,
      nameAr: this.ouForm.nameAr,
      type: this.ouForm.type,
      organizationId: orgId,
      parentId: this.ouForm.parentId ?? null,
      managerEmployeeId: this.ouForm.managerEmployeeId ?? null,
      displayOrder: this.ouForm.displayOrder ?? 0,
    };
    if (id) {
      this.savingOu.set(true);
      this.ouApi.update(id, { code: payload.code, nameEn: payload.nameEn, nameAr: payload.nameAr, type: payload.type, parentId: payload.parentId, managerEmployeeId: payload.managerEmployeeId, displayOrder: payload.displayOrder }).subscribe({
        next: () => { this.savingOu.set(false); this.closeOuModal(); this.loadOus(); this.loadOuOptions(orgId); },
        error: (err) => { this.savingOu.set(false); this.modalOuError.set(err.error?.errors?.[0] ?? err.error?.message ?? 'Error'); },
      });
    } else {
      if (!payload.code?.trim() || !payload.nameEn?.trim()) {
        this.modalOuError.set(this.translate.instant('validation.required'));
        return;
      }
      this.savingOu.set(true);
      this.ouApi.create(payload).subscribe({
        next: () => { this.savingOu.set(false); this.closeOuModal(); this.loadOus(); this.loadOuOptions(orgId); },
        error: (err) => { this.savingOu.set(false); this.modalOuError.set(err.error?.errors?.[0] ?? err.error?.message ?? 'Error'); },
      });
    }
  }

  setOuStatus(ou: OrganizationalUnitListDto): void {
    this.ouApi.setStatus(ou.id, { isActive: !ou.isActive }).subscribe({
      next: () => { this.loadOus(); this.loadOuOptions(ou.organizationId); },
      error: () => {},
    });
  }

  getLocalizedName(nameAr?: string | null, nameEn?: string | null): string {
    const currentLang = (this.translate.currentLang || this.translate.getDefaultLang() || 'en').toLowerCase();
    const prefersArabic = currentLang.startsWith('ar');
    const ar = nameAr?.trim() ?? '';
    const en = nameEn?.trim() ?? '';
    if (prefersArabic) return ar || en || '—';
    return en || ar || '—';
  }

  getParentName(parentId: string): string | null {
    const ou = this.ouOptions().find(o => o.id === parentId);
    return ou ? this.getLocalizedName(ou.nameAr, ou.nameEn) : null;
  }
}
