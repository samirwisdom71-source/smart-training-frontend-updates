import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" role="region" aria-label="Notifications">
      @for (t of toast.messages(); track t.id) {
        <div
          class="toast toast--{{ t.type }}"
          [attr.role]="'alert'"
          [attr.aria-live]="'polite'"
        >
          <span class="toast__message">{{ t.message }}</span>
          <button
            type="button"
            class="toast__close"
            (click)="toast.dismiss(t.id)"
            [attr.aria-label]="'Close'"
          >×</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: var(--space-lg);
      right: var(--space-lg);
      z-index: 1200;
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
      max-width: 360px;
    }
    .toast {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-md);
      padding: var(--space-md) var(--space-lg);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      background: var(--color-bg-elevated);
      border: 1px solid var(--color-border-light);
    }
    .toast--success { border-inline-start: 4px solid var(--color-success); }
    .toast--error { border-inline-start: 4px solid var(--color-error); }
    .toast--info { border-inline-start: 4px solid var(--color-primary); }
    .toast__message { flex: 1; font-size: var(--text-body-sm); }
    .toast__close {
      background: none; border: none; font-size: 1.25rem; line-height: 1;
      color: var(--color-text-muted); cursor: pointer; padding: 0 4px;
    }
    .toast__close:hover { color: var(--color-text); }
  `],
})
export class ToastContainerComponent {
  readonly toast = inject(ToastService);
}
