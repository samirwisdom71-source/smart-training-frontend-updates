import { Component, output, input, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [TranslateModule],
  template: `
    <div class="confirm-overlay" role="dialog" [attr.aria-modal]="true" [attr.aria-labelledby]="titleId" (keydown.escape)="cancel.emit()">
      <div class="confirm-dialog ds-card ds-card--elevated">
        <h2 [id]="titleId" class="confirm-dialog__title">{{ title() }}</h2>
        <p class="confirm-dialog__message">{{ message() }}</p>
        <div class="confirm-dialog__actions">
          <button #cancelBtn type="button" class="ds-btn ds-btn--secondary" (click)="cancel.emit()">{{ cancelLabel() }}</button>
          <button type="button" class="ds-btn ds-btn--danger" (click)="confirm.emit()">{{ confirmLabel() }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .confirm-overlay {
      position: fixed; inset: 0; z-index: 1100;
      background: rgba(15, 23, 42, 0.5); display: flex; align-items: center; justify-content: center;
      padding: var(--space-lg);
    }
    .confirm-dialog { max-width: 400px; width: 100%; }
    .confirm-dialog__title { font-size: var(--text-h1); font-weight: 600; margin: 0 0 var(--space-sm); }
    .confirm-dialog__message { color: var(--color-text-secondary); font-size: var(--text-body-sm); margin: 0 0 var(--space-lg); }
    .confirm-dialog__actions { display: flex; justify-content: flex-end; gap: var(--space-sm); }
  `]
})
export class ConfirmDialogComponent implements AfterViewInit {
  @ViewChild('cancelBtn') cancelBtn!: ElementRef<HTMLButtonElement>;
  titleId = 'confirm-dialog-title';
  title = input.required<string>();
  message = input<string>('');
  confirmLabel = input<string>('common.confirm');
  cancelLabel = input<string>('common.cancel');
  confirm = output<void>();
  cancel = output<void>();

  ngAfterViewInit(): void {
    setTimeout(() => this.cancelBtn?.nativeElement?.focus(), 0);
  }
}
