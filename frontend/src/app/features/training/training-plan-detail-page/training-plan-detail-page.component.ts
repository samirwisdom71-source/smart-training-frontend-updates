import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { TrainingPlansApiService } from '../../../core/api/training-plans/training-plans-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionCodes } from '../../../core/auth/permissions';
import { ToastService } from '../../../core/toast/toast.service';
import type { AnnualTrainingPlanDto, TrainingPlanItemDto, AddTrainingPlanItemRequest, UpdateTrainingPlanItemRequest } from '../../../core/api/training-plans/training-plans-api.models';

@Component({
  selector: 'app-training-plan-detail-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, RouterLink, DecimalPipe, PageShellComponent, ConfirmDialogComponent],
  templateUrl: './training-plan-detail-page.component.html',
  styleUrls: ['./training-plan-detail-page.component.scss'],
})
export class TrainingPlanDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(TrainingPlansApiService);
  private readonly auth = inject(AuthService);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(ToastService);

  readonly plan = signal<AnnualTrainingPlanDto | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly showItemModal = signal(false);
  readonly editingItem = signal<TrainingPlanItemDto | null>(null);
  readonly saving = signal(false);
  readonly modalError = signal<string | null>(null);

  readonly showConfirm = signal(false);
  readonly toDeleteItem = signal<TrainingPlanItemDto | null>(null);
  readonly deleting = signal(false);

  itemForm: AddTrainingPlanItemRequest = {
    annualTrainingPlanId: '',
    trainingNeedId: null,
    titleEn: '',
    titleAr: '',
    descriptionEn: null,
    descriptionAr: null,
    targetAudience: null,
    plannedParticipantCount: null,
    estimatedCost: null,
    priority: null,
  };

  canEdit = () => this.auth.hasPermission(PermissionCodes.trainingPlan.edit);
  canSubmit = () => this.auth.hasPermission(PermissionCodes.trainingPlan.submit);
  canApprove = () => this.auth.hasPermission(PermissionCodes.trainingPlan.approve);

  planId = computed(() => this.route.snapshot.paramMap.get('id') ?? '');
  breadcrumbs = computed(() => {
    const p = this.plan();
    const label = p ? p.titleEn : this.translate.instant('nav.trainingPlan');
    return [
      { label: this.translate.instant('nav.trainingPlan'), route: '/training-plans' },
      { label },
    ];
  });

  totalCost = computed(() => {
    const items = this.plan()?.items ?? [];
    return items.reduce((sum, i) => sum + (i.estimatedCost ?? 0), 0);
  });

  ngOnInit(): void {
    const id = this.planId();
    if (id) this.load(id);
  }

  load(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getById(id).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) this.plan.set(res.data);
        else this.error.set(res.message ?? 'Not found');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? err.message ?? 'Failed to load');
      },
    });
  }

  openAddItem(): void {
    const id = this.planId();
    this.editingItem.set(null);
    this.itemForm = {
      annualTrainingPlanId: id,
      trainingNeedId: null,
      titleEn: '',
      titleAr: '',
      descriptionEn: null,
      descriptionAr: null,
      targetAudience: null,
      plannedParticipantCount: null,
      estimatedCost: null,
      priority: null,
    };
    this.modalError.set(null);
    this.showItemModal.set(true);
  }

  openEditItem(item: TrainingPlanItemDto): void {
    this.editingItem.set(item);
    this.itemForm = {
      annualTrainingPlanId: item.annualTrainingPlanId,
      trainingNeedId: item.trainingNeedId,
      titleEn: item.titleEn,
      titleAr: item.titleAr,
      descriptionEn: item.descriptionEn ?? null,
      descriptionAr: item.descriptionAr ?? null,
      targetAudience: item.targetAudience ?? null,
      plannedParticipantCount: item.plannedParticipantCount ?? null,
      estimatedCost: item.estimatedCost ?? null,
      priority: item.priority ?? null,
    };
    this.modalError.set(null);
    this.showItemModal.set(true);
  }

  closeItemModal(): void {
    this.showItemModal.set(false);
    this.editingItem.set(null);
  }

  saveItem(): void {
    this.modalError.set(null);
    const planId = this.planId();
    const editing = this.editingItem();
    if (editing) {
      this.saving.set(true);
      this.api.updateItem(planId, editing.id, {
        id: editing.id,
        titleEn: this.itemForm.titleEn,
        titleAr: this.itemForm.titleAr,
        descriptionEn: this.itemForm.descriptionEn,
        descriptionAr: this.itemForm.descriptionAr,
        targetAudience: this.itemForm.targetAudience,
        plannedParticipantCount: this.itemForm.plannedParticipantCount,
        estimatedCost: this.itemForm.estimatedCost,
        priority: this.itemForm.priority,
        status: (this.itemForm as { status?: string }).status ?? editing.status,
      }).subscribe({
        next: () => { this.saving.set(false); this.closeItemModal(); this.load(planId); },
        error: (err) => { this.saving.set(false); this.modalError.set(err.error?.errors?.[0] ?? err.error?.message ?? 'Error'); },
      });
    } else {
      if (!this.itemForm.titleEn?.trim() || !this.itemForm.titleAr?.trim()) {
        this.modalError.set(this.translate.instant('validation.required'));
        return;
      }
      this.saving.set(true);
      this.api.addItem(planId, this.itemForm).subscribe({
        next: () => { this.saving.set(false); this.closeItemModal(); this.load(planId); },
        error: (err) => { this.saving.set(false); this.modalError.set(err.error?.errors?.[0] ?? err.error?.message ?? 'Error'); },
      });
    }
  }

  removeItem(item: TrainingPlanItemDto): void {
    this.toDeleteItem.set(item);
    this.showConfirm.set(true);
  }

  cancelDelete(): void {
    this.showConfirm.set(false);
    this.toDeleteItem.set(null);
  }

  deleteConfirmMessage = computed(() => this.translate.instant('dialog.confirmDelete'));

  doDelete(): void {
    const target = this.toDeleteItem();
    if (!target) return;
    const planId = this.planId();
    this.showConfirm.set(false);
    this.deleting.set(true);
    this.api.removeItem(planId, target.id).subscribe({
      next: (res) => {
        this.deleting.set(false);
        if (res.success) {
          this.toast.success(this.translate.instant('common.deleted'));
          this.load(planId);
        } else {
          this.toast.error(res.message ?? this.translate.instant('dialog.error'));
        }
      },
      error: (err) => {
        this.deleting.set(false);
        this.toast.error(err.error?.message ?? err.message ?? this.translate.instant('dialog.error'));
      },
    });
  }

  submitPlan(): void {
    const id = this.planId();
    this.api.submit(id).subscribe({ next: () => this.load(id), error: (err) => this.error.set(err.error?.message ?? 'Failed') });
  }

  approvePlan(): void {
    const id = this.planId();
    this.api.approve(id).subscribe({ next: () => this.load(id), error: (err) => this.error.set(err.error?.message ?? 'Failed') });
  }

  rejectPlan(): void {
    const id = this.planId();
    this.api.reject(id).subscribe({ next: () => this.load(id), error: (err) => this.error.set(err.error?.message ?? 'Failed') });
  }
}
