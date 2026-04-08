import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { TooltipDirective } from '../../../shared/tooltip/tooltip.directive';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { UsersApiService } from '../../../core/api/users/users-api.service';
import { RolesApiService } from '../../../core/api/roles/roles-api.service';
import { EmployeesApiService } from '../../../core/api/employees/employees-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionCodes } from '../../../core/auth/permissions';
import type { UserDto, CreateUserRequest, UpdateUserRequest } from '../../../core/api/users/users-api.models';
import type { RoleListDto } from '../../../core/api/roles/roles-api.models';
import type { EmployeeListDto } from '../../../core/api/employees/employees-api.models';
import type { ApiResponse, PagedResult } from '../../../core/models/api-response';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [FormsModule, TranslateModule, PageShellComponent, ConfirmDialogComponent, TooltipDirective, PaginationComponent],
  template: `
    <app-page-shell [title]="'nav.usersAndRoles' | translate" [breadcrumbs]="breadcrumbs()" [fullWidth]="true" [showPageTitle]="false">
      <div class="ent-admin-page ent-page-fade-in">
        <header class="ent-admin-hero">
          <div class="ent-admin-hero__inner">
            <h1 class="ent-admin-hero__title">{{ 'nav.usersAndRoles' | translate }}</h1>
            <p class="ent-admin-hero__subtitle">{{ 'enterprise.adminHeroSubtitle' | translate }}</p>
          </div>
        </header>

      <div class="actions-row">
        @if (canCreate()) {
          <button type="button" class="ds-btn ds-btn--primary ds-btn--sm premium-primary-btn" (click)="openCreate()" [appTooltip]="('common.add' | translate) + ' — ' + ('table.user' | translate)">{{ 'common.add' | translate }} {{ 'table.user' | translate }}</button>
        }
      </div>
      <div filters class="ent-admin-filters">
        <div class="ds-filterbar">
          <div class="ds-filterbar__controls">
            <div class="ds-filterfield">
              <div class="ds-filterfield__label">{{ 'common.search' | translate }}</div>
              <input type="text" class="ds-input filter-search ds-filterfield__control" [(ngModel)]="search" (ngModelChange)="onSearchChange()" [placeholder]="'common.search' | translate" />
            </div>
          </div>
          <div class="ds-filterbar__actions">
            <button type="button" class="ds-btn ds-btn--secondary ds-btn--sm" (click)="clearFilters()">
              {{ 'common.clearFilters' | translate }}
            </button>
          </div>
        </div>
      </div>

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
      } @else if (!data()?.items?.length) {
        <div class="ent-table-panel">
        <div class="ds-empty">
          <p class="ds-empty__title">{{ 'table.noRows' | translate }}</p>
          @if (canCreate()) {
            <button type="button" class="ds-btn ds-btn--primary ds-btn--sm premium-primary-btn" (click)="openCreate()">{{ 'common.add' | translate }}</button>
          }
        </div>
        </div>
      } @else {
        <div class="ent-table-panel">
        <div class="ds-table-wrap">
          <table class="ds-table">
            <thead>
              <tr>
                <th>{{ 'table.name' | translate }}</th>
                <th>{{ 'table.email' | translate }}</th>
                <th>{{ 'table.role' | translate }}</th>
                <th>{{ 'table.manager' | translate }}</th>
                <th>{{ 'table.status' | translate }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (u of data()!.items; track u.id) {
                <tr>
                  <td>
                    <div class="cell-user">
                      <span class="cell-avatar">{{ initials(u.fullName) }}</span>
                      {{ u.fullName }}
                    </div>
                  </td>
                  <td>{{ u.email }}</td>
                  <td>{{ u.roleNames ?? '—' }}</td>
                  <td class="cell-manager">{{ u.managerName ?? '—' }}</td>
                  <td><span class="ds-badge" [class.ds-badge--success]="u.isActive" [class.ds-badge--neutral]="!u.isActive">{{ u.isActive ? ('status.active' | translate) : ('status.inactive' | translate) }}</span></td>
                  <td class="cell-actions">
                    @if (canEdit()) {
                      <button
                        type="button"
                        class="ds-btn ds-btn--ghost ds-btn--icon"
                        (click)="openSetManager(u)"
                        [attr.aria-label]="'users.setManager' | translate"
                        [appTooltip]="'users.setManager' | translate"
                      >
                        <svg class="icon-svg" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="none" stroke="currentColor" stroke-width="1.5"/>
                        </svg>
                      </button>
                      <button
                        type="button"
                        class="ds-btn ds-btn--ghost ds-btn--icon"
                        (click)="openEdit(u)"
                        [attr.aria-label]="'common.edit' | translate"
                        [appTooltip]="'common.edit' | translate"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="icon-svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"> 
                        <g clip-path="url(#clip0_4418_7276)"> <path d="M15 22.75H9C3.57 22.75 1.25 20.43 1.25 15V9C1.25 3.57 3.57 1.25 9 1.25H11C11.41 1.25 11.75 1.59 11.75 2C11.75 2.41 11.41 2.75 11 2.75H9C4.39 2.75 2.75 4.39 2.75 9V15C2.75 19.61 4.39 21.25 9 21.25H15C19.61 21.25 21.25 19.61 21.25 15V13C21.25 12.59 21.59 12.25 22 12.25C22.41 12.25 22.75 12.59 22.75 13V15C22.75 20.43 20.43 22.75 15 22.75Z" fill="white" style="fill: var(--fillg);"/> <path d="M8.50008 17.6905C7.89008 17.6905 7.33008 17.4705 6.92008 17.0705C6.43008 16.5805 6.22008 15.8705 6.33008 15.1205L6.76008 12.1105C6.84008 11.5305 7.22008 10.7805 7.63008 10.3705L15.5101 2.49055C17.5001 0.500547 19.5201 0.500547 21.5101 2.49055C22.6001 3.58055 23.0901 4.69055 22.9901 5.80055C22.9001 6.70055 22.4201 7.58055 21.5101 8.48055L13.6301 16.3605C13.2201 16.7705 12.4701 17.1505 11.8901 17.2305L8.88008 17.6605C8.75008 17.6905 8.62008 17.6905 8.50008 17.6905ZM16.5701 3.55055L8.69008 11.4305C8.50008 11.6205 8.28008 12.0605 8.24008 12.3205L7.81008 15.3305C7.77008 15.6205 7.83008 15.8605 7.98008 16.0105C8.13008 16.1605 8.37008 16.2205 8.66008 16.1805L11.6701 15.7505C11.9301 15.7105 12.3801 15.4905 12.5601 15.3005L20.4401 7.42055C21.0901 6.77055 21.4301 6.19055 21.4801 5.65055C21.5401 5.00055 21.2001 4.31055 20.4401 3.54055C18.8401 1.94055 17.7401 2.39055 16.5701 3.55055Z" fill="white" style="fill: var(--fillg);"/> <path d="M19.8501 9.83027C19.7801 9.83027 19.7101 9.82027 19.6501 9.80027C17.0201 9.06027 14.9301 6.97027 14.1901 4.34027C14.0801 3.94027 14.3101 3.53027 14.7101 3.41027C15.1101 3.30027 15.5201 3.53027 15.6301 3.93027C16.2301 6.06027 17.9201 7.75027 20.0501 8.35027C20.4501 8.46027 20.6801 8.88027 20.5701 9.28027C20.4801 9.62027 20.1801 9.83027 19.8501 9.83027Z" fill="white" style="fill: var(--fillg);"/> </g> <defs> <clipPath id="clip0_4418_7276"> <rect width="24" height="24" fill="white"/> </clipPath> </defs> </svg>
                      </button>
                    }
                    @if (canDelete()) {
                      <button
                        type="button"
                        class="ds-btn ds-btn--ghost ds-btn--icon ds-btn--danger"
                        (click)="confirmDelete(u)"
                        [attr.aria-label]="'common.delete' | translate"
                        [appTooltip]="'common.delete' | translate"
                      >
                        <svg class="icon-svg" viewBox="0 0 24 24">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="none" stroke="currentColor" stroke-width="1.5"/>
                        </svg>
                      </button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <app-pagination
          [page]="page()"
          [totalPages]="data()?.totalPages ?? 1"
          [disabled]="loading()"
          (pageChange)="setPage($event)"
        />
        </div>
      }
      </div>
      </div>
    </app-page-shell>

    @if (showModal()) {
      <div class="ent-modal-overlay">
        <button type="button" class="ent-modal-backdrop" [attr.aria-label]="'common.close' | translate" (click)="closeModal()"></button>
        <div class="ent-modal-shell modal-drawer premium-modal" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
          <div class="premium-modal__header">
            <div class="premium-modal__titlewrap">
              <h3 class="premium-modal__title">{{ editingId() ? ('common.edit' | translate) : ('common.add' | translate) }} {{ 'table.user' | translate }}</h3>
              <p class="premium-modal__subtitle">{{ 'nav.usersAndRoles' | translate }}</p>
            </div>
            <button type="button" class="ds-btn ds-btn--ghost ds-btn--icon premium-modal__close" (click)="closeModal()" [attr.aria-label]="'common.close' | translate" [appTooltip]="'common.close' | translate">
              <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
            </button>
          </div>
          <div class="premium-modal__body">
          @if (modalError()) {
            <div class="premium-modal__error">
              <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 9v4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                <path d="M12 17h.01" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
              </svg>
              <p class="premium-modal__error-text">{{ modalError() }}</p>
            </div>
          }
          <form class="premium-form" (ngSubmit)="saveUser()">
            <div class="form-group">
              <label class="ds-label">{{ 'auth.email' | translate }}</label>
              <input type="email" class="ds-input" [(ngModel)]="form.email" name="email" [readonly]="!!editingId()" />
            </div>
            @if (!editingId()) {
              <div class="form-group">
                <label class="ds-label">{{ 'auth.password' | translate }}</label>
                <div class="password-field-wrap">
                  <input [type]="showPassword() ? 'text' : 'password'" class="ds-input password-field-wrap__input" [(ngModel)]="form.password" name="password" />
                  <button type="button" class="ds-btn ds-btn--ghost ds-btn--icon password-field-wrap__toggle" (click)="showPassword.set(!showPassword())" [attr.aria-label]="(showPassword() ? 'auth.hidePassword' : 'auth.showPassword') | translate" [appTooltip]="(showPassword() ? 'auth.hidePassword' : 'auth.showPassword') | translate">
                    @if (showPassword()) {
<svg xmlns="http://www.w3.org/2000/svg" class="icon-svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
<g clip-path="url(#clip0_4418_7081)">
<path d="M11.9999 16.3299C9.60992 16.3299 7.66992 14.3899 7.66992 11.9999C7.66992 9.60992 9.60992 7.66992 11.9999 7.66992C14.3899 7.66992 16.3299 9.60992 16.3299 11.9999C16.3299 14.3899 14.3899 16.3299 11.9999 16.3299ZM11.9999 9.16992C10.4399 9.16992 9.16992 10.4399 9.16992 11.9999C9.16992 13.5599 10.4399 14.8299 11.9999 14.8299C13.5599 14.8299 14.8299 13.5599 14.8299 11.9999C14.8299 10.4399 13.5599 9.16992 11.9999 9.16992Z" fill="white" style="fill: var(--fillg);"/>
<path d="M12.0001 21.0205C8.24008 21.0205 4.69008 18.8205 2.25008 15.0005C1.19008 13.3505 1.19008 10.6605 2.25008 9.00047C4.70008 5.18047 8.25008 2.98047 12.0001 2.98047C15.7501 2.98047 19.3001 5.18047 21.7401 9.00047C22.8001 10.6505 22.8001 13.3405 21.7401 15.0005C19.3001 18.8205 15.7501 21.0205 12.0001 21.0205ZM12.0001 4.48047C8.77008 4.48047 5.68008 6.42047 3.52008 9.81047C2.77008 10.9805 2.77008 13.0205 3.52008 14.1905C5.68008 17.5805 8.77008 19.5205 12.0001 19.5205C15.2301 19.5205 18.3201 17.5805 20.4801 14.1905C21.2301 13.0205 21.2301 10.9805 20.4801 9.81047C18.3201 6.42047 15.2301 4.48047 12.0001 4.48047Z" fill="white" style="fill: var(--fillg);"/>
</g>
<defs>
<clipPath id="clip0_4418_7081">
<rect width="24" height="24" fill="white"/>
</clipPath>
</defs>
</svg>                     } @else {
<svg xmlns="http://www.w3.org/2000/svg" class="icon-svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
<g clip-path="url(#clip0_4418_7080)">
<path d="M9.46992 15.2799C9.27992 15.2799 9.08992 15.2099 8.93992 15.0599C8.11992 14.2399 7.66992 13.1499 7.66992 11.9999C7.66992 9.60992 9.60992 7.66992 11.9999 7.66992C13.1499 7.66992 14.2399 8.11992 15.0599 8.93992C15.1999 9.07992 15.2799 9.26992 15.2799 9.46992C15.2799 9.66992 15.1999 9.85992 15.0599 9.99992L9.99992 15.0599C9.84992 15.2099 9.65992 15.2799 9.46992 15.2799ZM11.9999 9.16992C10.4399 9.16992 9.16992 10.4399 9.16992 11.9999C9.16992 12.4999 9.29992 12.9799 9.53992 13.3999L13.3999 9.53992C12.9799 9.29992 12.4999 9.16992 11.9999 9.16992Z" fill="white" style="fill: var(--fillg);"/>
<path d="M5.60009 18.5105C5.43009 18.5105 5.25009 18.4505 5.11009 18.3305C4.04009 17.4205 3.08009 16.3005 2.26009 15.0005C1.20009 13.3505 1.20009 10.6605 2.26009 9.00047C4.70009 5.18047 8.25009 2.98047 12.0001 2.98047C14.2001 2.98047 16.3701 3.74047 18.2701 5.17047C18.6001 5.42047 18.6701 5.89047 18.4201 6.22047C18.1701 6.55047 17.7001 6.62047 17.3701 6.37047C15.7301 5.13047 13.8701 4.48047 12.0001 4.48047C8.77009 4.48047 5.68009 6.42047 3.52009 9.81047C2.77009 10.9805 2.77009 13.0205 3.52009 14.1905C4.27009 15.3605 5.13009 16.3705 6.08009 17.1905C6.39009 17.4605 6.43009 17.9305 6.16009 18.2505C6.02009 18.4205 5.81009 18.5105 5.60009 18.5105Z" fill="white" style="fill: var(--fillg);"/>
<path d="M12.0001 21.0195C10.6701 21.0195 9.37006 20.7495 8.12006 20.2195C7.74006 20.0595 7.56006 19.6195 7.72006 19.2395C7.88006 18.8595 8.32006 18.6795 8.70006 18.8395C9.76006 19.2895 10.8701 19.5195 11.9901 19.5195C15.2201 19.5195 18.3101 17.5795 20.4701 14.1895C21.2201 13.0195 21.2201 10.9795 20.4701 9.80951C20.1601 9.31951 19.8201 8.84951 19.4601 8.40951C19.2001 8.08951 19.2501 7.61951 19.5701 7.34951C19.8901 7.08951 20.3601 7.12951 20.6301 7.45951C21.0201 7.93951 21.4001 8.45951 21.7401 8.99951C22.8001 10.6495 22.8001 13.3395 21.7401 14.9995C19.3001 18.8195 15.7501 21.0195 12.0001 21.0195Z" fill="white" style="fill: var(--fillg);"/>
<path d="M12.6901 16.2703C12.3401 16.2703 12.0201 16.0203 11.9501 15.6603C11.8701 15.2503 12.1401 14.8603 12.5501 14.7903C13.6501 14.5903 14.5701 13.6703 14.7701 12.5703C14.8501 12.1603 15.2401 11.9003 15.6501 11.9703C16.0601 12.0503 16.3301 12.4403 16.2501 12.8503C15.9301 14.5803 14.5501 15.9503 12.8301 16.2703C12.7801 16.2603 12.7401 16.2703 12.6901 16.2703Z" fill="white" style="fill: var(--fillg);"/>
<path d="M1.99994 22.7507C1.80994 22.7507 1.61994 22.6807 1.46994 22.5307C1.17994 22.2407 1.17994 21.7607 1.46994 21.4707L8.93994 14.0007C9.22994 13.7107 9.70994 13.7107 9.99994 14.0007C10.2899 14.2907 10.2899 14.7707 9.99994 15.0607L2.52994 22.5307C2.37994 22.6807 2.18994 22.7507 1.99994 22.7507Z" fill="white" style="fill: var(--fillg);"/>
<path d="M14.53 10.2195C14.34 10.2195 14.15 10.1495 14 9.99945C13.71 9.70945 13.71 9.22945 14 8.93945L21.47 1.46945C21.76 1.17945 22.24 1.17945 22.53 1.46945C22.82 1.75945 22.82 2.23945 22.53 2.52945L15.06 9.99945C14.91 10.1495 14.72 10.2195 14.53 10.2195Z" fill="white" style="fill: var(--fillg);"/>
</g>
<defs>
<clipPath id="clip0_4418_7080">
<rect width="24" height="24" fill="white"/>
</clipPath>
</defs>
</svg>                     }
                  </button>
                </div>
              </div>
            }
            <div class="form-group">
              <label class="ds-label">{{ 'profile.fullName' | translate }}</label>
              <input type="text" class="ds-input" [(ngModel)]="form.fullName" name="fullName" />
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'users.roles' | translate }}</label>
              <div class="roles-checkbox-list">
                @for (r of roleOptions(); track r.id) {
                  <label class="checkbox-row">
                    <input type="checkbox" [checked]="isRoleSelected(r.id)" (change)="toggleRole(r.id)" />
                    <span>{{ getRoleLabel(r.name) }}</span>
                  </label>
                }
                @if (roleOptions().length === 0) {
                  <p class="ds-hint">{{ 'common.noData' | translate }}</p>
                }
              </div>
            </div>
            @if (editingId()) {
              <label class="checkbox-wrap">
                <input type="checkbox" [(ngModel)]="form.isActive" name="isActive" />
                <span>{{ 'status.active' | translate }}</span>
              </label>
            }
            <div class="premium-modal__footer">
              <button type="button" class="ds-btn ds-btn--secondary premium-secondary-btn" (click)="closeModal()">{{ 'common.cancel' | translate }}</button>
              <button type="submit" class="ds-btn ds-btn--primary premium-primary-btn" [disabled]="saving()">{{ saving() ? ('common.loading' | translate) : ('common.save' | translate) }}</button>
            </div>
          </form>
          </div>
        </div>
      </div>
    }

    @if (showManagerModal()) {
      <div class="ent-modal-overlay">
        <button type="button" class="ent-modal-backdrop" [attr.aria-label]="'common.close' | translate" (click)="closeManagerModal()"></button>
        <div class="ent-modal-shell ent-modal-shell--sm modal-drawer premium-modal" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
          <div class="premium-modal__header">
            <div class="premium-modal__titlewrap">
              <h3 class="premium-modal__title">{{ 'users.setManager' | translate }}</h3>
              <p class="premium-modal__subtitle">{{ userForManager()?.fullName }}</p>
            </div>
            <button type="button" class="ds-btn ds-btn--ghost ds-btn--icon premium-modal__close" (click)="closeManagerModal()" [attr.aria-label]="'common.close' | translate" [appTooltip]="'common.close' | translate">
              <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
            </button>
          </div>
          <div class="premium-modal__body">
          @if (managerModalError()) {
            <div class="premium-modal__error">
              <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 9v4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                <path d="M12 17h.01" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
              </svg>
              <p class="premium-modal__error-text">{{ managerModalError() }}</p>
            </div>
          }
          <div class="form-group">
            <label class="ds-label">{{ 'table.manager' | translate }}</label>
            <select class="ds-input" [(ngModel)]="selectedManagerUserId" name="selectedManagerUserId">
              <option [ngValue]="null">—</option>
              @for (emp of managerEmployeeOptions(); track emp.id) {
                @if (emp.userId && emp.userId !== userForManager()?.id) {
                  <option [ngValue]="emp.userId">{{ emp.fullNameEn }} ({{ emp.employeeNumber }})</option>
                }
              }
            </select>
          </div>
          <div class="premium-modal__footer">
            <button type="button" class="ds-btn ds-btn--secondary premium-secondary-btn" (click)="closeManagerModal()">{{ 'common.cancel' | translate }}</button>
            <button type="button" class="ds-btn ds-btn--primary premium-primary-btn" (click)="saveManager()" [disabled]="savingManager()">{{ savingManager() ? ('common.loading' | translate) : ('common.save' | translate) }}</button>
          </div>
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
    .actions-row { display: flex; justify-content: flex-end; margin-bottom: var(--space-sm); flex-wrap: wrap; gap: var(--space-sm); }
    .filter-search { max-width: 280px; }
    .table-loading { padding: var(--space-md) var(--space-lg); }
    .cell-user { display: flex; align-items: center; gap: var(--space-sm); }
    .cell-avatar {
      width: 30px;
      height: 30px;
      border-radius: var(--radius-full);
      background: color-mix(in srgb, var(--gulf-gold) 14%, var(--color-primary-muted));
      color: var(--gulf-green-800);
      font-size: var(--text-caption);
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid color-mix(in srgb, var(--gulf-gold) 25%, transparent);
    }
    .cell-actions { text-align: center; display: flex; flex-wrap: nowrap; gap: var(--space-2xs); justify-content: flex-end; align-items: center; }
    .ds-hint { font-size: var(--text-body-sm); color: var(--color-text-secondary); margin: var(--space-xs) 0 0; }
    .checkbox-wrap { display: flex; align-items: center; gap: var(--space-sm); font-size: var(--text-body-sm); cursor: pointer; margin-bottom: var(--space-md); }
    .checkbox-wrap input { accent-color: var(--gulf-green-800); }
  `]
})
export class UsersPageComponent implements OnInit {
  private readonly api = inject(UsersApiService);
  private readonly rolesApi = inject(RolesApiService);
  private readonly employeesApi = inject(EmployeesApiService);
  private readonly auth = inject(AuthService);
  private readonly translate = inject(TranslateService);

  readonly data = signal<PagedResult<UserDto> | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly page = signal(1);
  readonly pageSize = 10;
  search = '';
  searchDebounce: ReturnType<typeof setTimeout> | null = null;

  readonly showModal = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly modalError = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly roleOptions = signal<RoleListDto[]>([]);

  readonly showManagerModal = signal(false);
  readonly userForManager = signal<UserDto | null>(null);
  readonly managerEmployeeOptions = signal<EmployeeListDto[]>([]);
  readonly managerModalError = signal<string | null>(null);
  readonly savingManager = signal(false);
  selectedManagerUserId: string | null = null;

  readonly showConfirm = signal(false);
  readonly toDelete = signal<UserDto | null>(null);
  deleteConfirmMessage = computed(() => {
    const u = this.toDelete();
    return u ? this.translate.instant('users.deleteConfirm', { name: u.fullName || u.email }) : '';
  });

  form: CreateUserRequest & { password?: string; isActive?: boolean; roleIds?: string[] } = {
    email: '',
    password: '',
    fullName: '',
    isActive: true,
    roleIds: []
  };

  canCreate = () => this.auth.hasPermission(PermissionCodes.user.create);
  canEdit = () => this.auth.hasPermission(PermissionCodes.user.edit);
  canDelete = () => this.auth.hasPermission(PermissionCodes.user.delete);

  breadcrumbs = computed(() => [{ label: this.translate.instant('nav.usersAndRoles') }]);

  ngOnInit(): void {
    this.load();
    this.loadRoles();
  }

  loadRoles(): void {
    this.rolesApi.getPaged({ page: 1, pageSize: 500 }).subscribe({
      next: (res) => { if (res.success && res.data) this.roleOptions.set(res.data.items); }
    });
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getPaged({ page: this.page(), pageSize: this.pageSize, search: this.search || undefined }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) this.data.set(res.data);
        else this.error.set(res.message ?? 'Failed to load');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? err.message ?? 'Failed to load');
      }
    });
  }

  onSearchChange(): void {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => { this.page.set(1); this.load(); }, 300);
  }

  clearFilters(): void {
    this.search = '';
    this.page.set(1);
    this.load();
  }

  prevPage(): void { this.page.update(p => Math.max(1, p - 1)); this.load(); }
  nextPage(): void { this.page.update(p => p + 1); this.load(); }
  setPage(p: number): void { this.page.set(p); this.load(); }

  initials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase() || '—';
  }

  getRoleLabel(roleName: string): string {
    const key = 'roles.' + roleName;
    const t = this.translate.instant(key);
    return t !== key ? t : roleName;
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form = { email: '', password: '', fullName: '', isActive: true, roleIds: [] };
    this.showPassword.set(false);
    this.modalError.set(null);
    this.showModal.set(true);
  }

  openEdit(u: UserDto): void {
    this.editingId.set(u.id);
    this.api.getById(u.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const d = res.data;
          this.form = {
            email: d.email,
            password: '',
            fullName: d.fullName,
            profilePicturePath: d.profilePicturePath,
            isActive: d.isActive,
            preferredLocale: d.preferredLocale ?? null,
            roleIds: d.roleIds ? [...d.roleIds] : []
          };
        }
      }
    });
    this.modalError.set(null);
    this.showModal.set(true);
  }

  isRoleSelected(roleId: string): boolean {
    return (this.form.roleIds ?? []).includes(roleId);
  }

  toggleRole(roleId: string): void {
    const ids = this.form.roleIds ?? [];
    const idx = ids.indexOf(roleId);
    if (idx === -1) this.form.roleIds = [...ids, roleId];
    else this.form.roleIds = ids.filter(id => id !== roleId);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingId.set(null);
  }

  openSetManager(u: UserDto): void {
    this.userForManager.set(u);
    this.selectedManagerUserId = null;
    this.managerModalError.set(null);
    this.showManagerModal.set(true);
    this.employeesApi.getPaged({ page: 1, pageSize: 500 }).subscribe({
      next: (res) => { if (res.success && res.data) this.managerEmployeeOptions.set(res.data.items); }
    });
  }

  closeManagerModal(): void {
    this.showManagerModal.set(false);
    this.userForManager.set(null);
    this.managerEmployeeOptions.set([]);
    this.managerModalError.set(null);
  }

  saveManager(): void {
    const user = this.userForManager();
    if (!user) return;
    this.managerModalError.set(null);
    this.savingManager.set(true);
    this.api.setManager(user.id, this.selectedManagerUserId).subscribe({
      next: () => { this.savingManager.set(false); this.closeManagerModal(); this.load(); },
      error: (err) => {
        this.savingManager.set(false);
        this.managerModalError.set(err.error?.errors?.[0] ?? err.error?.message ?? err.message ?? 'Error');
      }
    });
  }

  confirmDelete(u: UserDto): void {
    this.toDelete.set(u);
    this.showConfirm.set(true);
  }

  cancelDelete(): void {
    this.showConfirm.set(false);
    this.toDelete.set(null);
  }

  doDelete(): void {
    const u = this.toDelete();
    if (!u) return;
    this.api.delete(u.id).subscribe({
      next: () => { this.cancelDelete(); this.load(); },
      error: (err) => { this.cancelDelete(); this.error.set(err.error?.message ?? err.message ?? 'Delete failed'); }
    });
  }

  saveUser(): void {
    this.modalError.set(null);
    const id = this.editingId();
    if (id) {
      this.saving.set(true);
      this.api.update(id, {
        fullName: this.form.fullName,
        profilePicturePath: this.form.profilePicturePath ?? null,
        isActive: this.form.isActive ?? true,
        preferredLocale: this.form.preferredLocale ?? null,
        roleIds: this.form.roleIds ?? []
      }).subscribe({
        next: () => { this.saving.set(false); this.closeModal(); this.load(); },
        error: (err) => { this.saving.set(false); this.modalError.set(err.error?.errors?.[0] ?? err.error?.message ?? err.message ?? 'Error'); }
      });
    } else {
      if (!this.form.email || !this.form.fullName) {
        this.modalError.set(this.translate.instant('validation.required'));
        return;
      }
      if (!this.form.password) {
        this.modalError.set(this.translate.instant('validation.required'));
        return;
      }
      this.saving.set(true);
      this.api.create({
        email: this.form.email,
        password: this.form.password,
        fullName: this.form.fullName,
        isActive: this.form.isActive ?? true,
        roleIds: this.form.roleIds ?? []
      }).subscribe({
        next: () => { this.saving.set(false); this.closeModal(); this.load(); },
        error: (err) => { this.saving.set(false); this.modalError.set(err.error?.errors?.[0] ?? err.error?.message ?? err.message ?? 'Error'); }
      });
    }
  }
}
