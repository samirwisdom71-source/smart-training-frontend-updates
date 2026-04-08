import { Component, computed, input, output } from '@angular/core';
import { NgClass } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

type PageToken = number | '…';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [NgClass, TranslateModule],
  template: `
    @if (totalPages() > 1) {
      <nav class="ent-pager" [class.ent-pager--disabled]="disabled()" aria-label="Pagination">
        <div class="ent-pager__left">
          <button
            type="button"
            class="ds-btn ds-btn--ghost ds-btn--sm ent-pager__nav"
            [disabled]="disabled() || page() <= 1"
            (click)="goTo(1)"
            [attr.aria-label]="'common.first' | translate"
            [title]="'common.first' | translate"
          >
            <span class="ent-pager__chev" aria-hidden="true">«</span>
          </button>
          <button
            type="button"
            class="ds-btn ds-btn--ghost ds-btn--sm ent-pager__nav"
            [disabled]="disabled() || page() <= 1"
            (click)="goTo(page() - 1)"
            [attr.aria-label]="'common.previous' | translate"
            [title]="'common.previous' | translate"
          >
            <span class="ent-pager__chev" aria-hidden="true">‹</span>
            <span class="ent-pager__navLabel">{{ 'common.previous' | translate }}</span>
          </button>
        </div>

        <div class="ent-pager__center" aria-live="polite">
          <div class="ent-pager__meta">
            <span class="ent-pager__metaText">{{ 'common.page' | translate }} {{ page() }}</span>
            <span class="ent-pager__metaSep" aria-hidden="true">/</span>
            <span class="ent-pager__metaText">{{ totalPages() }}</span>
          </div>

          <div class="ent-pager__nums" role="list">
            @for (t of tokens(); track $index) {
              @if (t === '…') {
                <span class="ent-pager__ellipsis" aria-hidden="true">…</span>
              } @else {
                <button
                  type="button"
                  role="listitem"
                  class="ent-pager__num"
                  [ngClass]="{ 'active': t === page() }"
                  [disabled]="disabled() || t === page()"
                  (click)="goTo(t)"
                  [attr.aria-current]="t === page() ? 'page' : null"
                >
                  {{ t }}
                </button>
              }
            }
          </div>
        </div>

        <div class="ent-pager__right">
          <button
            type="button"
            class="ds-btn ds-btn--ghost ds-btn--sm ent-pager__nav"
            [disabled]="disabled() || page() >= totalPages()"
            (click)="goTo(page() + 1)"
            [attr.aria-label]="'common.next' | translate"
            [title]="'common.next' | translate"
          >
            <span class="ent-pager__navLabel">{{ 'common.next' | translate }}</span>
            <span class="ent-pager__chev" aria-hidden="true">›</span>
          </button>
          <button
            type="button"
            class="ds-btn ds-btn--ghost ds-btn--sm ent-pager__nav"
            [disabled]="disabled() || page() >= totalPages()"
            (click)="goTo(totalPages())"
            [attr.aria-label]="'common.last' | translate"
            [title]="'common.last' | translate"
          >
            <span class="ent-pager__chev" aria-hidden="true">»</span>
          </button>
        </div>
      </nav>
    }
  `,
  styles: [`
    .ent-pager {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: var(--space-md);
      align-items: center;
      padding: var(--space-sm) 0 var(--space-xs);
      margin-top: var(--space-md);
    }

    .ent-pager--disabled {
      opacity: 0.7;
      pointer-events: none;
    }

    .ent-pager__left,
    .ent-pager__right {
      display: inline-flex;
      align-items: center;
      gap: var(--space-xs);
      flex-wrap: wrap;
    }

    .ent-pager__right {
      justify-content: flex-end;
    }

    .ent-pager__nav {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border-radius: 999px;
      border: 1px solid transparent;
      transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.18s ease;
    }

    .ent-pager__nav:hover:not(:disabled) {
      border-color: color-mix(in srgb, var(--gulf-gold) 34%, var(--color-border));
      box-shadow: 0 0 18px rgba(200, 164, 93, 0.14);
      transform: translateY(-1px);
    }

    .ent-pager__chev {
      font-size: 1.15rem;
      line-height: 1;
      opacity: 0.9;
    }

    .ent-pager__navLabel {
      font-weight: 700;
      font-size: var(--text-body-sm);
      color: #fff;
    }

    .ent-pager__center {
      display: grid;
      justify-items: center;
      gap: 10px;
      min-width: 0;
    }

    .ent-pager__meta {
      display: inline-flex;
      align-items: baseline;
      gap: 8px;
      padding: 6px 12px;
      border-radius: 999px;
      border: 1px solid color-mix(in srgb, var(--gulf-gold) 16%, var(--color-border-light));
      background: color-mix(in srgb, var(--color-bg-elevated) 95%, var(--gulf-emerald) 5%);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85);
    }

    .ent-pager__metaText {
      font-size: var(--text-body-sm);
      font-weight: 800;
      color: color-mix(in srgb, var(--color-text) 86%, var(--gulf-green-900) 14%);
    }

    .ent-pager__metaSep {
      opacity: 0.6;
      font-weight: 800;
    }

    .ent-pager__nums {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
      justify-content: center;
      min-width: 0;
    }

    .ent-pager__num {
      min-width: 34px;
      height: 34px;
      padding: 0 10px;
      border-radius: 999px;
      border: 1px solid color-mix(in srgb, var(--gulf-green-800) 10%, var(--color-border));
      background: rgba(255, 255, 255, 0.75);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
      font-size: var(--text-body-sm);
      font-weight: 800;
      cursor: pointer;
      transition: transform 0.18s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease;
      color: var(--color-text);
    }

    .ent-pager__num:hover:not(:disabled) {
      transform: translateY(-1px);
      border-color: color-mix(in srgb, var(--gulf-gold) 36%, var(--color-border));
      box-shadow: 0 10px 20px rgba(15, 61, 46, 0.08), 0 0 18px rgba(200, 164, 93, 0.12);
    }

    .ent-pager__num.active {
      background: linear-gradient(145deg, var(--gulf-green-800), color-mix(in srgb, var(--gulf-green-700) 82%, var(--gulf-gold) 18%));
      border-color: color-mix(in srgb, var(--gulf-gold) 34%, transparent);
      color: #fff;
      box-shadow: 0 12px 26px rgba(15, 61, 46, 0.18), 0 0 22px rgba(200, 164, 93, 0.12);
    }

    .ent-pager__ellipsis {
      padding: 0 6px;
      font-weight: 900;
      opacity: 0.6;
      user-select: none;
    }

    @media (max-width: 760px) {
      .ent-pager {
        grid-template-columns: 1fr;
        justify-items: stretch;
      }

      .ent-pager__left,
      .ent-pager__right {
        justify-content: center;
      }

      .ent-pager__center {
        order: -1;
      }

      .ent-pager__navLabel {
        display: none;
      }
    }
  `]
})
export class PaginationComponent {
  page = input.required<number>();
  totalPages = input.required<number>();
  disabled = input(false);
  /** How many numbers to show around current page. */
  siblingCount = input(1);

  pageChange = output<number>();

  tokens = computed<PageToken[]>(() => {
    const total = Math.max(1, Math.floor(this.totalPages() || 1));
    const current = this.clamp(Math.floor(this.page() || 1), 1, total);
    const sib = this.clamp(Math.floor(this.siblingCount() || 1), 0, 3);

    if (total <= 7 + sib * 2) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const left = Math.max(2, current - sib);
    const right = Math.min(total - 1, current + sib);

    const showLeftEllipsis = left > 2;
    const showRightEllipsis = right < total - 1;

    const out: PageToken[] = [1];

    if (showLeftEllipsis) out.push('…');
    for (let p = left; p <= right; p++) out.push(p);
    if (showRightEllipsis) out.push('…');

    out.push(total);
    return out;
  });

  goTo(p: number): void {
    const total = Math.max(1, Math.floor(this.totalPages() || 1));
    const target = this.clamp(Math.floor(p || 1), 1, total);
    if (target === Math.floor(this.page() || 1)) return;
    this.pageChange.emit(target);
  }

  private clamp(v: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, v));
  }
}

