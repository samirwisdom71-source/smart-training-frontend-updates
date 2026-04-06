import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  OnDestroy,
  effect,
  inject,
} from '@angular/core';
import { AuthService } from '../auth/auth.service';

/**
 * Structural directive to show content only if the current user has one of the given permissions.
 * Usage: *appShowIfPermission="'employee:view'" or *appShowIfPermission="['employee:view','employee:create']"
 */
@Directive({
  selector: '[appShowIfPermission]',
  standalone: true,
})
export class ShowIfPermissionDirective implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);

  private hasView = false;
  private permissions: string[] = [];

  @Input() set appShowIfPermission(value: string | string[]) {
    this.permissions = Array.isArray(value) ? value : [value];
    this.updateView();
  }

  constructor() {
    effect(() => {
      this.auth.user();
      this.updateView();
    });
  }

  private updateView(): void {
    const show = this.auth.hasAnyPermission(this.permissions);
    if (show && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!show && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }

  ngOnDestroy(): void {
    if (this.hasView) this.viewContainer.clear();
  }
}
