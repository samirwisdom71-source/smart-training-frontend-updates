import { Directive, ElementRef, HostListener, Input, NgZone, OnDestroy, Renderer2, inject } from '@angular/core';

type TooltipPlacement = 'top' | 'bottom' | 'start' | 'end';

@Directive({
  selector: '[appTooltip]',
  standalone: true,
})
export class TooltipDirective implements OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef as any);
  private readonly renderer = inject(Renderer2);
  private readonly zone = inject(NgZone);

  @Input('appTooltip') text: string | null | undefined = null;
  @Input() tooltipPlacement: TooltipPlacement = 'top';
  @Input() tooltipDisabled = false;

  private tooltipEl: HTMLElement | null = null;
  private raf = 0;
  private visible = false;

  ngOnDestroy(): void {
    this.hide();
  }

  @HostListener('mouseenter')
  onMouseEnter(): void {
    this.show();
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.hide();
  }

  @HostListener('focusin')
  onFocusIn(): void {
    this.show();
  }

  @HostListener('focusout')
  onFocusOut(): void {
    this.hide();
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.hide();
  }

  @HostListener('window:scroll')
  onScroll(): void {
    if (this.visible) this.position();
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.visible) this.position();
  }

  private show(): void {
    const value = (this.text ?? '').trim();
    if (!value || this.tooltipDisabled) return;

    // Fallback accessibility: expose tooltip text to native UIs as well.
    // (Doesn't replace the custom tooltip; helps screen readers/tooling.)
    this.renderer.setAttribute(this.host.nativeElement, 'title', value);

    if (!this.tooltipEl) {
      this.tooltipEl = this.renderer.createElement('div');
      this.renderer.addClass(this.tooltipEl, 'app-tooltip');
      this.renderer.setAttribute(this.tooltipEl, 'role', 'tooltip');
      this.renderer.appendChild(document.body, this.tooltipEl);
    }

    const el = this.tooltipEl;
    if (!el) return;

    el.textContent = value;
    this.renderer.addClass(el, 'app-tooltip--visible');
    this.visible = true;

    this.position();
  }

  private hide(): void {
    if (!this.tooltipEl) return;
    this.visible = false;
    this.renderer.removeClass(this.tooltipEl, 'app-tooltip--visible');

    // Remove from DOM shortly after to avoid leaving many nodes around.
    // Keep it simple and safe (no timers leaking across route changes).
    this.zone.runOutsideAngular(() => {
      window.cancelAnimationFrame(this.raf);
      this.raf = window.requestAnimationFrame(() => {
        if (!this.visible && this.tooltipEl) {
          this.renderer.removeChild(document.body, this.tooltipEl);
          this.tooltipEl = null;
        }
      });
    });
  }

  private position(): void {
    if (!this.tooltipEl) return;

    const hostRect = this.host.nativeElement.getBoundingClientRect();

    // Force a measure pass.
    this.renderer.setStyle(this.tooltipEl, 'left', '0px');
    this.renderer.setStyle(this.tooltipEl, 'top', '0px');
    this.renderer.setStyle(this.tooltipEl, 'transform', 'translate3d(-9999px, -9999px, 0)');

    const ttRect = this.tooltipEl.getBoundingClientRect();
    const margin = 10;

    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;

    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

    let x = hostRect.left + hostRect.width / 2 - ttRect.width / 2;
    let y = hostRect.top - ttRect.height - 8;

    switch (this.tooltipPlacement) {
      case 'bottom':
        x = hostRect.left + hostRect.width / 2 - ttRect.width / 2;
        y = hostRect.bottom + 8;
        break;
      case 'start':
        x = hostRect.left - ttRect.width - 10;
        y = hostRect.top + hostRect.height / 2 - ttRect.height / 2;
        break;
      case 'end':
        x = hostRect.right + 10;
        y = hostRect.top + hostRect.height / 2 - ttRect.height / 2;
        break;
      case 'top':
      default:
        x = hostRect.left + hostRect.width / 2 - ttRect.width / 2;
        y = hostRect.top - ttRect.height - 8;
        break;
    }

    // Keep on-screen.
    x = clamp(x, margin, vw - ttRect.width - margin);
    y = clamp(y, margin, vh - ttRect.height - margin);

    const left = x + window.scrollX;
    const top = y + window.scrollY;

    this.renderer.setStyle(this.tooltipEl, 'left', `${left}px`);
    this.renderer.setStyle(this.tooltipEl, 'top', `${top}px`);
    this.renderer.setStyle(this.tooltipEl, 'transform', 'translate3d(0, 0, 0)');
  }
}

