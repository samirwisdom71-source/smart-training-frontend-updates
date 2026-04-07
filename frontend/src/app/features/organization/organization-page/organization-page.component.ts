import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { TooltipDirective } from '../../../shared/tooltip/tooltip.directive';
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
  imports: [FormsModule, TranslateModule, PageShellComponent, ConfirmDialogComponent, TooltipDirective],
  template: `
    <app-page-shell [title]="'nav.organization' | translate" [breadcrumbs]="breadcrumbs()" [showPageTitle]="false">
      <div class="org-page ds-animate-fade-up" data-delay="1">
        <header class="org-hero">
          <div class="org-hero__inner">
            <h1 class="org-hero__title">{{ 'nav.organization' | translate }}</h1>
            <p class="org-hero__subtitle">{{ 'org.pageSubtitle' | translate }}</p>
          </div>
        </header>

        <div class="actions-row org-actions" actions>
          @if (canCreate()) {
            <button type="button" class="ds-btn ds-btn--primary ds-btn--sm org-primary-btn" (click)="openOrgCreate()">
              <span class="org-primary-btn__icon" aria-hidden="true">
                <svg class="icon-svg" viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </span>
              {{ 'common.add' | translate }} {{ 'table.organization' | translate }}
            </button>
          }
        </div>
        <div class="org-filters" filters>
          <div class="ds-filterbar org-filterbar">
            <div class="ds-filterbar__controls">
              <div class="ds-filterfield">
                <div class="ds-filterfield__label">{{ 'common.search' | translate }}</div>
                <input
                  type="text"
                  class="ds-input filter-search ds-filterfield__control org-input"
                  [(ngModel)]="search"
                  (ngModelChange)="onSearchChange()"
                  [placeholder]="'common.search' | translate"
                />
              </div>
              <div class="ds-filterfield">
                <div class="ds-filterfield__label">{{ 'table.status' | translate }}</div>
                <select class="ds-input filter-select ds-filterfield__control org-input" [(ngModel)]="isActiveFilter" (ngModelChange)="onFilterChange()">
                  <option [ngValue]="null">{{ 'common.all' | translate }}</option>
                  <option [ngValue]="true">{{ 'status.active' | translate }}</option>
                  <option [ngValue]="false">{{ 'status.inactive' | translate }}</option>
                </select>
              </div>
            </div>
            <div class="ds-filterbar__actions">
              <button type="button" class="ds-btn ds-btn--secondary ds-btn--sm org-secondary-btn" (click)="clearFilters()">
                <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 5l14 14M19 5 5 19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                {{ 'common.clearFilters' | translate }}
              </button>
            </div>
          </div>
        </div>

        @if (loading()) {
          <div class="table-loading org-loading">
            <div class="ds-skeleton" style="height: 48px; margin-bottom: 8px;"></div>
            <div class="ds-skeleton" style="height: 48px; margin-bottom: 8px;"></div>
            <div class="ds-skeleton" style="height: 48px;"></div>
          </div>
        } @else if (error()) {
          <div class="ds-error-state org-state">
            <p class="ds-error-state__title">{{ error() }}</p>
            <button type="button" class="ds-btn ds-btn--secondary ds-btn--sm org-secondary-btn" (click)="loadOrgs()">{{ 'empty.tryAgain' | translate }}</button>
          </div>
        } @else if (!orgData()?.items?.length) {
          <div class="ds-empty org-state">
            <p class="ds-empty__title">{{ 'table.noRows' | translate }}</p>
            @if (canCreate()) {
              <button type="button" class="ds-btn ds-btn--primary ds-btn--sm org-primary-btn" (click)="openOrgCreate()">{{ 'common.add' | translate }}</button>
            }
          </div>
        } @else {
          <div class="ds-table-wrap org-table-wrap">
            <table class="ds-table org-table">
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
                  <tr class="org-row" [class.org-row--selected]="selectedOrgId() === o.id">
                    <td class="org-code">{{ o.code }}</td>
                    <td class="org-name">{{ getLocalizedName(o.nameAr, o.nameEn) }}</td>
                    <td><span class="ds-badge org-badge" [class.ds-badge--success]="o.isActive" [class.ds-badge--neutral]="!o.isActive">{{ o.isActive ? ('status.active' | translate) : ('status.inactive' | translate) }}</span></td>
                    <td>
                      @if (o.isDefault) {
                      <span class="default-star default-star--on" [appTooltip]="'org.defaultOrg' | translate" aria-label="'org.defaultOrg' | translate">
                          <svg class="default-star__icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/></svg>
                        </span>
                      } @else if (canEdit()) {
                      <button type="button" class="default-star default-star--off ds-focus-ring" (click)="setAsDefault(o); $event.stopPropagation()" [appTooltip]="'org.setAsDefault' | translate" [attr.aria-label]="'org.setAsDefault' | translate">
                          <svg class="default-star__icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
                        </button>
                      } @else {
                        <span>—</span>
                      }
                    </td>
                    <td class="cell-actions">
                      <button
                        type="button"
                        class="ds-btn ds-btn--ghost ds-btn--icon ds-btn--view-units org-view-btn"
                        (click)="selectOrg(o.id)"
                        [attr.aria-label]="'org.viewUnits' | translate"
                        [appTooltip]="'org.viewUnits' | translate"
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
                          class="ds-btn ds-btn--ghost ds-btn--icon org-icon-btn"
                          (click)="openOrgEdit(o); $event.stopPropagation()"
                          [attr.aria-label]="'common.edit' | translate"
                          [appTooltip]="'common.edit' | translate"
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
                          class="ds-btn ds-btn--ghost ds-btn--icon org-icon-btn"
                          (click)="setOrgStatus(o); $event.stopPropagation()"
                          [attr.aria-label]="'org.setStatus' | translate"
                          [appTooltip]="'org.setStatus' | translate"
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
                            class="ds-btn ds-btn--ghost ds-btn--icon ds-btn--danger org-icon-btn"
                            (click)="confirmDeleteOrg(o); $event.stopPropagation()"
                            [attr.aria-label]="'common.delete' | translate"
                            [appTooltip]="'common.delete' | translate"
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
          <div class="pagination org-pagination">
            <button type="button" class="ds-btn ds-btn--ghost ds-btn--sm org-pagination__btn" [disabled]="!orgData()?.hasPreviousPage" (click)="prevOrgPage()">{{ 'common.previous' | translate }}</button>
            <span class="pagination-info">{{ 'common.page' | translate }} {{ orgPage() }} {{ 'common.of' | translate }} {{ orgData()?.totalPages ?? 1 }}</span>
            <button type="button" class="ds-btn ds-btn--ghost ds-btn--sm org-pagination__btn" [disabled]="!orgData()?.hasNextPage" (click)="nextOrgPage()">{{ 'common.next' | translate }}</button>
          </div>
        }

        @if (selectedOrgId()) {
          <section class="section-ou org-ou">
            <div class="org-ou__head">
              <h2 class="section-ou__title org-ou__title">{{ 'org.organizationalUnits' | translate }}</h2>
              @if (canCreate()) {
                <button type="button" class="ds-btn ds-btn--primary ds-btn--sm org-primary-btn" (click)="openOuCreate()">
                  <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                  {{ 'common.add' | translate }} {{ 'table.organizationalUnit' | translate }}
                </button>
              }
            </div>
            @if (ouLoading() || ouOptionsLoading()) {
              <div class="table-loading org-loading">
                <div class="ds-skeleton" style="height: 48px; margin-bottom: 8px;"></div>
                <div class="ds-skeleton" style="height: 48px;"></div>
              </div>
            } @else if (!ouOptions().length && !ouOptionsLoading()) {
              <div class="ds-empty org-state">
                <p class="ds-empty__title">{{ 'table.noRows' | translate }}</p>
                @if (canCreate()) {
                  <button type="button" class="ds-btn ds-btn--primary ds-btn--sm org-primary-btn" (click)="openOuCreate()">{{ 'common.add' | translate }}</button>
                }
              </div>
            } @else {
              <div class="ds-table-wrap org-table-wrap">
                <table class="ds-table ds-table--ou-tree org-table">
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
                        class="ou-tree__row org-ou-row"
                        [class.ou-tree__row--root]="row.depth === 0"
                        [class.ou-tree__row--child]="row.depth > 0"
                        [style.--ou-depth]="row.depth"
                      >
                        <td class="ou-tree__td-toggle">
                          @if (hasOuChildren(row.ou.id)) {
                            <button type="button" class="ou-tree__toggler ds-focus-ring" (click)="toggleOuExpanded(row.ou.id); $event.stopPropagation()" [class.ou-tree__toggler--open]="isOuExpanded(row.ou.id)" [attr.aria-expanded]="isOuExpanded(row.ou.id)" [attr.aria-label]="isOuExpanded(row.ou.id) ? ('common.collapse' | translate) : ('common.expand' | translate)">
                              <svg class="ou-tree__chevron" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M9 18l6-6-6-6"/></svg>
                            </button>
                          } @else {
                            <span class="ou-tree__toggler-spacer" aria-hidden="true"></span>
                          }
                        </td>
                        <td class="ou-tree__td-code org-code">{{ row.ou.code }}</td>
                        <td class="org-name">{{ getLocalizedName(row.ou.nameAr, row.ou.nameEn) }}</td>
                        <td>{{ ('org.ouType.' + row.ou.type) | translate }}</td>
                        <td>{{ row.ou.parentId ? (getParentName(row.ou.parentId) || row.ou.parentId) : '—' }}</td>
                        <td>{{ row.ou.displayOrder }}</td>
                        <td><span class="ds-badge org-badge" [class.ds-badge--success]="row.ou.isActive" [class.ds-badge--neutral]="!row.ou.isActive">{{ row.ou.isActive ? ('status.active' | translate) : ('status.inactive' | translate) }}</span></td>
                        <td class="cell-actions">
                          @if (canEdit()) {
                            <button
                              type="button"
                              class="ds-btn ds-btn--ghost ds-btn--icon org-icon-btn"
                              (click)="openOuEdit(row.ou)"
                              [attr.aria-label]="'common.edit' | translate"
                            [appTooltip]="'common.edit' | translate"
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
                              class="ds-btn ds-btn--ghost ds-btn--icon org-icon-btn"
                              (click)="setOuStatus(row.ou)"
                              [attr.aria-label]="'org.setStatus' | translate"
                            [appTooltip]="'org.setStatus' | translate"
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
                                class="ds-btn ds-btn--ghost ds-btn--icon ds-btn--danger org-icon-btn"
                                (click)="confirmDeleteOu(row.ou)"
                                [attr.aria-label]="'common.delete' | translate"
                                [appTooltip]="'common.delete' | translate"
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
      </div>
    </app-page-shell>

    @if (showOrgModal()) {
      <div class="modal-overlay" (click)="closeOrgModal()">
        <div class="modal-drawer org-modal org-modal--org" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
          <div class="org-modal__header">
            <div class="org-modal__titlewrap">
              <h3 class="org-modal__title">
                {{ editingOrgId() ? ('common.edit' | translate) : ('common.add' | translate) }} {{ 'table.organization' | translate }}
              </h3>
              <p class="org-modal__subtitle">{{ 'nav.organization' | translate }}</p>
            </div>
            <button type="button" class="ds-btn ds-btn--ghost ds-btn--icon org-modal__close" (click)="closeOrgModal()" [attr.aria-label]="'common.close' | translate" [appTooltip]="'common.close' | translate">
              <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <div class="org-modal__body">
            @if (modalError()) {
              <div class="org-modal__error">
                <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 9v4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <path d="M12 17h.01" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                </svg>
                <p class="org-modal__error-text">{{ modalError() }}</p>
              </div>
            }
            <form class="org-form" (ngSubmit)="saveOrg()">
              <div class="form-group">
                <label class="ds-label">{{ 'table.code' | translate }}</label>
                <input type="text" class="ds-input org-input" [(ngModel)]="orgForm.code" name="orgCode" />
              </div>
              <div class="form-group">
                <label class="ds-label">{{ 'table.nameEn' | translate }}</label>
                <input type="text" class="ds-input org-input" [(ngModel)]="orgForm.nameEn" name="orgNameEn" />
              </div>
              <div class="form-group">
                <label class="ds-label">{{ 'table.nameAr' | translate }}</label>
                <input type="text" class="ds-input org-input" [(ngModel)]="orgForm.nameAr" name="orgNameAr" />
              </div>
              <div class="org-modal__footer">
                <button type="button" class="ds-btn ds-btn--secondary org-secondary-btn" (click)="closeOrgModal()">{{ 'common.cancel' | translate }}</button>
                <button type="submit" class="ds-btn ds-btn--primary org-primary-btn" [disabled]="saving()">
                  {{ saving() ? ('common.loading' | translate) : ('common.save' | translate) }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }

    @if (showOuModal()) {
      <div class="modal-overlay" (click)="closeOuModal()">
        <div class="modal-drawer org-modal" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
          <div class="org-modal__header">
            <div class="org-modal__titlewrap">
              <h3 class="org-modal__title">
                {{ editingOuId() ? ('common.edit' | translate) : ('common.add' | translate) }} {{ 'table.organizationalUnit' | translate }}
              </h3>
              <p class="org-modal__subtitle">{{ 'org.organizationalUnits' | translate }}</p>
            </div>
            <button type="button" class="ds-btn ds-btn--ghost ds-btn--icon org-modal__close" (click)="closeOuModal()" [attr.aria-label]="'common.close' | translate" [appTooltip]="'common.close' | translate">
              <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <div class="org-modal__body">
            @if (modalOuError()) {
              <div class="org-modal__error">
                <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 9v4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <path d="M12 17h.01" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                </svg>
                <p class="org-modal__error-text">{{ modalOuError() }}</p>
              </div>
            }
            <form class="org-form" (ngSubmit)="saveOu()">
              <div class="form-group">
                <label class="ds-label">{{ 'table.code' | translate }}</label>
                <input type="text" class="ds-input org-input" [(ngModel)]="ouForm.code" name="ouCode" />
              </div>
              <div class="form-group">
                <label class="ds-label">{{ 'table.nameEn' | translate }}</label>
                <input type="text" class="ds-input org-input" [(ngModel)]="ouForm.nameEn" name="ouNameEn" />
              </div>
              <div class="form-group">
                <label class="ds-label">{{ 'table.nameAr' | translate }}</label>
                <input type="text" class="ds-input org-input" [(ngModel)]="ouForm.nameAr" name="ouNameAr" />
              </div>
              <div class="form-group">
                <label class="ds-label">{{ 'table.type' | translate }}</label>
                <select class="ds-input org-input" [(ngModel)]="ouForm.type" name="ouType">
                  @for (t of ouTypes; track t) {
                    <option [value]="t">{{ 'org.ouType.' + t | translate }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label class="ds-label">{{ 'org.parentUnitLabel' | translate }}</label>
                <p class="ds-hint" aria-hidden="true">{{ 'org.parentUnitHint' | translate }}</p>
                <select class="ds-input org-input" [(ngModel)]="ouForm.parentId" name="ouParentId">
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
                <input type="number" class="ds-input org-input" [(ngModel)]="ouForm.displayOrder" name="ouDisplayOrder" min="0" />
              </div>
              <div class="org-modal__footer">
                <button type="button" class="ds-btn ds-btn--secondary org-secondary-btn" (click)="closeOuModal()">{{ 'common.cancel' | translate }}</button>
                <button type="submit" class="ds-btn ds-btn--primary org-primary-btn" [disabled]="savingOu()">
                  {{ savingOu() ? ('common.loading' | translate) : ('common.save' | translate) }}
                </button>
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
    .org-page {
      --org-radius-lg: 18px;
      --org-radius-md: 14px;
      --org-border: color-mix(in srgb, var(--gulf-gold) 18%, var(--color-border-light));
      --org-border-strong: color-mix(in srgb, var(--gulf-gold) 30%, var(--color-border));
      --org-glow: 0 0 28px rgba(200, 164, 93, 0.18);
      --org-shadow-card: 0 12px 34px rgba(15, 61, 46, 0.08);
      --org-shadow-lift: 0 18px 44px rgba(15, 61, 46, 0.12);
      font-family: var(--font-sans);
    }

    /* Header — Impact-style hero */
    .org-hero {
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

    .org-hero::after {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse 80% 60% at 0% 0%, rgba(200, 164, 93, 0.18), transparent 55%);
      pointer-events: none;
    }

    .org-hero__inner { position: relative; z-index: 1; }

    .org-hero__title {
      margin: 0 0 var(--space-xs);
      font-size: clamp(1.35rem, 2.5vw, 1.75rem);
      font-weight: 800;
      letter-spacing: -0.02em;
      text-shadow: 0 1px 18px rgba(0, 0, 0, 0.2);
    }

    .org-hero__subtitle {
      margin: 0;
      font-size: var(--text-body-sm);
      font-weight: 600;
      color: var(--gulf-text-muted);
      max-width: 52rem;
      line-height: var(--line-height-normal);
    }

    .org-actions {
      margin-bottom: var(--space-md);
    }

    .org-primary-btn {
      background: linear-gradient(
        145deg,
        var(--gulf-green-800),
        color-mix(in srgb, var(--gulf-green-700) 86%, var(--gulf-gold) 14%)
      );
      border-color: color-mix(in srgb, var(--gulf-gold) 28%, transparent);
      box-shadow: 0 10px 28px rgba(15, 61, 46, 0.16), 0 0 22px rgba(200, 164, 93, 0.12);
      transition: transform 0.18s ease, box-shadow 0.22s ease, filter 0.22s ease;
    }

    .org-primary-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      filter: saturate(1.04);
      box-shadow: 0 14px 34px rgba(15, 61, 46, 0.2), 0 0 30px rgba(200, 164, 93, 0.16);
    }

    .org-primary-btn__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.14);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18);
    }

    .org-secondary-btn {
      border-color: color-mix(in srgb, var(--gulf-green-800) 14%, var(--color-border-light));
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, var(--color-bg-elevated) 100%);
      box-shadow: 0 8px 22px rgba(15, 61, 46, 0.05);
      transition: transform 0.18s ease, box-shadow 0.22s ease, border-color 0.22s ease;
    }

    .org-secondary-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      border-color: var(--gulf-gold);
      box-shadow: 0 12px 30px rgba(15, 61, 46, 0.08), 0 0 18px rgba(200, 164, 93, 0.14);
    }

    /* Filters — glass bar */
    .org-filterbar {
      padding: var(--space-md) var(--space-lg);
      border-radius: var(--org-radius-lg);
      border: 1px solid var(--org-border);
      background: linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.92) 0%,
        color-mix(in srgb, var(--color-bg-elevated) 92%, var(--gulf-emerald) 6%) 100%
      );
      margin-bottom: var(--space-md);
      box-shadow: var(--org-shadow-card), inset 0 1px 0 rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }

    .org-input {
      border-radius: var(--org-radius-md);
      border-color: color-mix(in srgb, var(--gulf-green-800) 12%, var(--color-border));
      transition: border-color 0.2s ease, box-shadow 0.22s ease, transform 0.18s ease;
    }

    .org-input:hover {
      border-color: color-mix(in srgb, var(--gulf-gold) 35%, var(--color-border));
    }

    .org-input:focus {
      border-color: var(--gulf-gold);
      box-shadow:
        0 0 0 3px color-mix(in srgb, var(--gulf-gold) 20%, transparent),
        0 0 26px rgba(200, 164, 93, 0.14);
    }

    .table-loading { padding: var(--space-md) 0; }
    .org-loading .ds-skeleton { border-radius: var(--org-radius-md); }

    .cell-actions { text-align: end; }

    /* Table — premium surface */
    .org-table-wrap {
      border-radius: var(--org-radius-lg);
      border-color: var(--org-border);
      box-shadow: var(--org-shadow-card);
      background: linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.98));
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      overflow: hidden;
    }

    .org-table th {
      background: linear-gradient(
        135deg,
        color-mix(in srgb, var(--gulf-green-800) 92%, #000) 0%,
        var(--gulf-green-800) 58%,
        color-mix(in srgb, var(--gulf-green-700) 88%, var(--gulf-gold) 12%) 100%
      );
      border-block-end: 1px solid rgba(255, 255, 255, 0.18);
      letter-spacing: 0.02em;
    }

    .org-row {
      transition: background 0.18s ease, transform 0.18s ease;
    }

    .org-row:hover td {
      background: linear-gradient(
        90deg,
        color-mix(in srgb, var(--gulf-gold) 9%, var(--color-bg-hover)) 0%,
        var(--color-bg-hover) 70%,
        rgba(255, 255, 255, 0.65) 100%
      );
    }

    .org-row--selected td {
      background: linear-gradient(
        90deg,
        color-mix(in srgb, var(--gulf-green-800) 8%, #fff) 0%,
        color-mix(in srgb, var(--gulf-gold) 9%, #fff) 55%,
        #fff 100%
      );
      box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--gulf-gold) 14%, transparent);
    }

    .org-code {
      font-weight: 700;
      color: color-mix(in srgb, var(--color-text) 88%, var(--gulf-green-800) 12%);
      font-variant-numeric: tabular-nums;
    }

    .org-name {
      font-weight: 600;
      letter-spacing: -0.01em;
    }

    .org-badge {
      border: 1px solid color-mix(in srgb, var(--gulf-gold) 16%, transparent);
      box-shadow: 0 6px 16px rgba(15, 61, 46, 0.05);
    }

    .org-view-btn {
      color: var(--gulf-green-800);
      border: 1px solid transparent;
    }

    .org-view-btn:hover:not(:disabled) {
      background: color-mix(in srgb, var(--gulf-gold) 12%, var(--color-bg-subtle));
      color: var(--gulf-green-900);
      box-shadow: 0 10px 26px rgba(200, 164, 93, 0.14);
    }

    .org-icon-btn:hover:not(:disabled) {
      background: color-mix(in srgb, var(--gulf-gold) 10%, var(--color-bg-subtle));
    }

    .default-star { display: inline-flex; align-items: center; justify-content: center; padding: 4px; border: none; background: none; cursor: default; }
    .default-star--off { cursor: pointer; color: var(--color-text-muted, #94a3b8); }
    .default-star--off:hover { color: color-mix(in srgb, var(--gulf-gold) 55%, var(--color-text-secondary)); }
    .default-star--on { color: var(--gulf-gold); filter: drop-shadow(0 0 12px rgba(200, 164, 93, 0.25)); }
    .default-star__icon { width: 20px; height: 20px; display: block; }

    .pagination { display: flex; align-items: center; gap: var(--space-md); margin-top: var(--space-lg); flex-wrap: wrap; }
    .pagination-info { font-size: var(--text-body-sm); color: var(--color-text-secondary); }

    .org-pagination__btn:hover:not(:disabled) {
      background: color-mix(in srgb, var(--gulf-gold) 10%, var(--color-bg-subtle));
      box-shadow: 0 0 16px rgba(200, 164, 93, 0.12);
    }

    /* OU section */
    .section-ou { margin-top: var(--space-xl); padding-top: var(--space-lg); border-top: 1px solid var(--org-border); }
    .org-ou__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-md);
      flex-wrap: wrap;
      margin-bottom: var(--space-md);
    }
    .section-ou__title { font-size: var(--text-h2); font-weight: 700; margin: 0; letter-spacing: -0.02em; }

    .ou-tree__th-toggle { width: 36px; padding-left: var(--space-sm); vertical-align: middle; }
    .ou-tree__td-toggle { width: 36px; padding-left: var(--space-sm); vertical-align: middle; }

    .org-ou-row { border-bottom: 1px solid color-mix(in srgb, var(--gulf-green-800) 6%, var(--color-border-light)); transition: background-color 0.18s ease; }
    .org-ou-row:hover { background: color-mix(in srgb, var(--gulf-gold) 6%, transparent); }

    .ou-tree__row--root {
      background: color-mix(in srgb, var(--gulf-green-800) 4%, #fff);
      font-weight: 700;
    }

    .ou-tree__row--root td {
      border-top: 2px solid color-mix(in srgb, var(--gulf-gold) 18%, transparent);
      border-bottom: 1px solid color-mix(in srgb, var(--gulf-green-800) 10%, transparent);
    }

    .ou-tree__row--child { background: rgba(255, 255, 255, 0.55); }
    .ou-tree__row--child td { color: var(--color-text-secondary, #475569); }
    .ou-tree__row--child .ou-tree__td-code { font-weight: 700; color: var(--color-text, #0f172a); }
    .ou-tree__row--root + .ou-tree__row--root td { border-top: 3px solid color-mix(in srgb, var(--gulf-gold) 14%, var(--color-border)); }

    .ou-tree__toggler { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; padding: 0; border: 1px solid transparent; background: rgba(255,255,255,0.7); border-radius: 10px; color: var(--color-text-secondary); cursor: pointer; transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease; }
    .ou-tree__toggler:hover { border-color: color-mix(in srgb, var(--gulf-gold) 35%, transparent); color: var(--gulf-green-900); box-shadow: 0 0 16px rgba(200,164,93,0.16); transform: translateY(-1px); }
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
      background: linear-gradient(180deg, var(--gulf-green-800), color-mix(in srgb, var(--gulf-gold) 55%, var(--gulf-green-800)));
      opacity: 0.6;
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.8);
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      z-index: 1000;
      background: radial-gradient(ellipse 85% 65% at 50% 0%, rgba(200, 164, 93, 0.16), transparent 55%), rgba(15,23,42,0.58);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-lg);
    }

    .modal-drawer {
      max-width: 520px;
      width: 100%;
      max-height: 90vh;
      overflow: auto;
      border-radius: 20px;
    }

    .org-modal--org {
      max-width: 680px;
    }

    .org-modal {
      border: 1px solid var(--org-border-strong);
      background: linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.88) 0%,
        color-mix(in srgb, var(--color-bg-elevated) 92%, var(--gulf-emerald) 6%) 100%
      );
      box-shadow: 0 30px 70px rgba(0, 0, 0, 0.25), var(--org-glow);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      overflow: hidden;
    }

    .org-modal__header {
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

    .org-modal__header::after {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse 80% 60% at 0% 0%, rgba(200, 164, 93, 0.22), transparent 55%);
      pointer-events: none;
    }

    .org-modal__titlewrap { position: relative; z-index: 1; min-width: 0; }

    .org-modal__title {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      text-shadow: 0 1px 18px rgba(0,0,0,0.22);
    }

    .org-modal__subtitle {
      margin: 0.25rem 0 0;
      font-size: 0.85rem;
      font-weight: 600;
      color: rgba(248, 250, 248, 0.8);
      letter-spacing: 0.01em;
    }

    .org-modal__close {
      position: relative;
      z-index: 1;
      background: rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.95);
      border: 1px solid rgba(255,255,255,0.18);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.12);
    }

    .org-modal__close:hover:not(:disabled) {
      background: rgba(255,255,255,0.18);
      border-color: rgba(200,164,93,0.6);
      box-shadow: 0 0 18px rgba(200,164,93,0.18), inset 0 1px 0 rgba(255,255,255,0.16);
    }

    .org-modal__body {
      padding: 18px;
    }

    .org-modal__error {
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

    .org-modal__error .icon-svg { width: 18px; height: 18px; color: #b91c1c; margin-top: 2px; }
    .org-modal__error-text { margin: 0; font-size: var(--text-body-sm); color: color-mix(in srgb, var(--color-text) 80%, #b91c1c 20%); line-height: 1.4; }

    .org-form .form-group { margin-bottom: var(--space-md); }
    .ds-hint { font-size: var(--text-body-sm, 0.875rem); color: var(--color-text-secondary, #64748b); margin: 0 0 var(--space-xs); }

    .org-modal__footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-sm);
      margin-top: var(--space-lg);
      padding-top: var(--space-md);
      border-top: 1px solid color-mix(in srgb, var(--gulf-green-800) 8%, var(--color-border-light));
    }

    /* Responsive (desktop-first, keep clean) */
    @media (max-width: 980px) {
      .org-filterbar { padding: var(--space-md); }
    }

    @media (max-width: 560px) {
      .org-modal__footer { flex-direction: column-reverse; align-items: stretch; }
      .modal-overlay { padding: var(--space-md); }
      .org-modal--org { max-width: 520px; }
    }
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
