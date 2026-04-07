import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, inject, OnDestroy, OnInit, Renderer2 } from '@angular/core';

/**
 * Moves the host element to document.body while keeping Angular bindings intact.
 * This avoids stacking-context issues (e.g., transforms/filters/overflow on ancestors)
 * that can cause "fixed + high z-index" overlays to still appear behind header/sidebar.
 */
@Directive({
  selector: '[appPortalToBody]',
  standalone: true,
})
export class PortalToBodyDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly doc = inject(DOCUMENT);

  private originalParent: Node | null = null;
  private placeholder: Comment | null = null;

  ngOnInit(): void {
    const native = this.el.nativeElement;
    const parent = native.parentNode;
    if (!parent) return;

    this.originalParent = parent;
    this.placeholder = this.renderer.createComment('appPortalToBody');
    this.renderer.insertBefore(parent, this.placeholder, native);
    this.renderer.appendChild(this.doc.body, native);
  }

  ngOnDestroy(): void {
    const native = this.el.nativeElement;

    // Remove the portaled element from its current parent (typically document.body).
    // Do NOT move it back to the original parent — that leaves orphaned DOM nodes
    // when Angular's @if view destruction and portal cleanup race each other.
    if (native.parentNode) {
      this.renderer.removeChild(native.parentNode, native);
    }

    // Clean up the placeholder comment left in the original parent.
    if (this.originalParent && this.placeholder && this.placeholder.parentNode) {
      this.renderer.removeChild(this.originalParent, this.placeholder);
    }

    this.originalParent = null;
    this.placeholder = null;
  }
}

