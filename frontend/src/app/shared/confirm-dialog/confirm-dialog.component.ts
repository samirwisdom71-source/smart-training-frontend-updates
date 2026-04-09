import { Component, output, input, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { PortalToBodyDirective } from '../portal/portal-to-body.directive';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [TranslateModule],
  hostDirectives: [PortalToBodyDirective],
  template: `
    <div
      class="confirm-overlay"
      role="dialog"
      [attr.aria-modal]="true"
      [attr.aria-labelledby]="titleId"
      (keydown.escape)="onEscape($event)"
    >
      <div
        class="confirm-dialog"
        [class.confirm-dialog--signout]="variant() === 'signOut'"
        (click)="$event.stopPropagation()"
      >
        <div class="confirm-dialog__header">
          @if (variant() === 'signOut') {
            <div class="confirm-dialog__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
          }
          <h2 [id]="titleId" class="confirm-dialog__title">{{ title() }}</h2>
        </div>
        @if (message()) {
          <p class="confirm-dialog__message">{{ message() }}</p>
        }
        <div class="confirm-dialog__actions">
          <button
            #cancelBtn
            type="button"
            class="confirm-dialog__btn confirm-dialog__btn--secondary"
            [disabled]="busy()"
            (click)="cancel.emit()"
          >
            {{ cancelLabel() }}
          </button>
          <button
            type="button"
            class="confirm-dialog__btn confirm-dialog__btn--danger"
            [disabled]="busy()"
            [attr.aria-busy]="busy()"
            (click)="confirm.emit()"
          >
            @if (busy()) {
              <span class="confirm-dialog__spinner" aria-hidden="true"></span>
              {{ busyLabel() || confirmLabel() }}
            } @else {
              {{ confirmLabel() }}
            }
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .confirm-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        /* Above premium modals (.modal-overlay / 2147483647); portaled to body avoids transform/stacking traps */
        z-index: 2147483647;
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        padding: max(var(--space-lg), env(safe-area-inset-top, 0px))
          max(var(--space-lg), env(safe-area-inset-right, 0px))
          max(var(--space-lg), env(safe-area-inset-bottom, 0px))
          max(var(--space-lg), env(safe-area-inset-left, 0px));
        background: rgba(11, 27, 24, 0.55);
        backdrop-filter: blur(10px) saturate(140%);
        -webkit-backdrop-filter: blur(10px) saturate(140%);
        overscroll-behavior: contain;
        animation: confirm-backdrop-in 0.22s ease-out;
      }

      .confirm-dialog {
        width: 100%;
        max-width: 420px;
        max-height: min(88vh, 640px);
        overflow: auto;
        padding: 15PX;
        border-radius: 20px;
        background: linear-gradient(
          165deg,
          color-mix(in srgb, #fdfffe 100%, var(--gulf-green-800) 2%) 0%,
          color-mix(in srgb, #f4faf8 98%, var(--gulf-green-900) 4%) 100%
        );
        border: 1px solid color-mix(in srgb, var(--gulf-gold) 32%, rgba(255, 255, 255, 0.5));
        box-shadow:
          0 1px 0 rgba(255, 255, 255, 0.9) inset,
          0 32px 64px rgba(12, 47, 37, 0.18),
          0 12px 28px rgba(15, 61, 46, 0.1),
          0 0 0 1px rgba(255, 255, 255, 0.5);
        animation: confirm-panel-in 0.28s cubic-bezier(0.22, 1, 0.36, 1);
      }

      .confirm-dialog__header {
        display: flex;
        align-items: flex-start;
        gap: var(--space-md);
        margin-bottom: var(--space-md);
      }

      .confirm-dialog__icon {
        flex-shrink: 0;
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 14px;
        color: color-mix(in srgb, var(--gulf-green-800) 88%, #fff);
        background: linear-gradient(
          145deg,
          color-mix(in srgb, var(--gulf-emerald) 18%, #fff) 0%,
          color-mix(in srgb, var(--gulf-green-800) 10%, #fff) 100%
        );
        border: 1px solid color-mix(in srgb, var(--gulf-gold) 35%, transparent);
        box-shadow: 0 4px 14px rgba(15, 61, 46, 0.1);
      }

      .confirm-dialog__icon svg {
        width: 24px;
        height: 24px;
      }

      .confirm-dialog__title {
        flex: 1;
        margin: 0;
        padding-top: 2px;
        font-size: clamp(1.15rem, 2.4vw, 1.35rem);
        font-weight: 700;
        letter-spacing: -0.02em;
        line-height: 1.25;
        color: var(--gulf-green-900, #0f291f);
      }

      .confirm-dialog--signout .confirm-dialog__message {
        padding-inline-start: calc(44px + var(--space-md));
      }

      .confirm-dialog__message {
        margin: 0 0 var(--space-xl);
        font-size: var(--text-body-sm);
        line-height: 1.55;
        color: var(--color-text-secondary, #475569);
      }

      .confirm-dialog__actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: var(--space-sm);
        align-items: center;
        padding-top: 10PX;
        border-top: 1px solid color-mix(in srgb, var(--gulf-green-800) 8%, transparent);
      }

      .confirm-dialog__btn {
        font-family: var(--font-sans, inherit);
        font-size: var(--text-body-sm);
        font-weight: 600;
        padding: 10px 20px;
        border-radius: 12px;
        cursor: pointer;
        border: 1px solid transparent;
        transition:
          background 0.2s ease,
          border-color 0.2s ease,
          box-shadow 0.2s ease,
          transform 0.15s ease;
        min-height: 44px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-xs);
      }

      .confirm-dialog__btn:disabled {
        opacity: 0.65;
        cursor: not-allowed;
        transform: none;
      }

      .confirm-dialog__btn--secondary {
        background: color-mix(in srgb, var(--color-bg-elevated) 92%, var(--gulf-green-800) 6%);
        border-color: color-mix(in srgb, var(--gulf-gold) 28%, var(--color-border-light));
        color: var(--gulf-green-900, #0f291f);
        box-shadow: 0 1px 0 rgba(255, 255, 255, 0.75) inset;
      }

      .confirm-dialog__btn--secondary:hover:not(:disabled) {
        background: color-mix(in srgb, var(--gulf-gold) 10%, #fff);
        border-color: color-mix(in srgb, var(--gulf-gold) 42%, var(--color-border-light));
      }

      .confirm-dialog__btn--danger {
        min-width: 8.5rem;
        background: linear-gradient(165deg, #dc2626 0%, #b91c1c 100%);
        color: #fff;
        border-color: color-mix(in srgb, #7f1d1d 22%, transparent);
        box-shadow:
          0 1px 0 rgba(255, 255, 255, 0.2) inset,
          0 8px 20px rgba(185, 28, 28, 0.25);
      }

      .confirm-dialog__btn--danger:hover:not(:disabled) {
        box-shadow:
          0 1px 0 rgba(255, 255, 255, 0.25) inset,
          0 10px 28px rgba(185, 28, 28, 0.32);
        transform: translateY(-1px);
      }

      .confirm-dialog__btn--danger:focus-visible {
        outline: 2px solid color-mix(in srgb, var(--gulf-gold) 70%, #fff);
        outline-offset: 2px;
      }

      .confirm-dialog__spinner {
        width: 1.05rem;
        height: 1.05rem;
        border: 2px solid rgba(255, 255, 255, 0.35);
        border-top-color: #fff;
        border-radius: 50%;
        animation: confirm-spin 0.65s linear infinite;
      }

      @keyframes confirm-spin {
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes confirm-backdrop-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes confirm-panel-in {
        from {
          opacity: 0;
          transform: translateY(12px) scale(0.98);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @media (max-width: 480px) {
        .confirm-dialog {
          padding: var(--space-lg);
        }

        .confirm-dialog__message {
          margin-bottom: var(--space-lg);
        }

        .confirm-dialog--signout .confirm-dialog__message {
          padding-inline-start: 0;
        }

        .confirm-dialog--signout .confirm-dialog__header {
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .confirm-dialog__actions {
          flex-direction: column-reverse;
        }

        .confirm-dialog__btn {
          width: 100%;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .confirm-overlay,
        .confirm-dialog {
          animation: none;
        }

        .confirm-dialog__btn--danger:hover:not(:disabled) {
          transform: none;
        }
      }
    `,
  ],
})
export class ConfirmDialogComponent implements AfterViewInit {
  @ViewChild('cancelBtn') cancelBtn!: ElementRef<HTMLButtonElement>;
  titleId = 'confirm-dialog-title';
  title = input.required<string>();
  /** Use `signOut` for the logout modal; other confirms stay compact without the icon strip */
  variant = input<'default' | 'signOut'>('default');
  message = input<string>('');
  confirmLabel = input<string>('common.confirm');
  cancelLabel = input<string>('common.cancel');
  /** When true, confirm shows a spinner and both actions are disabled */
  busy = input(false);
  /** Shown on the confirm button while busy (pass translated string) */
  busyLabel = input<string>('');
  confirm = output<void>();
  cancel = output<void>();

  ngAfterViewInit(): void {
    setTimeout(() => this.cancelBtn?.nativeElement?.focus(), 0);
  }

  onEscape(ev: Event): void {
    if (this.busy()) {
      ev.preventDefault();
      return;
    }
    this.cancel.emit();
  }
}
