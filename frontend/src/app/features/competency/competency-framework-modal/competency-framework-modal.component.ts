import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { PortalToBodyDirective } from '../../../shared/portal/portal-to-body.directive';
import { TooltipDirective } from '../../../shared/tooltip/tooltip.directive';
import { LocalizedTextPipe } from '../../../shared/pipes/localized-text.pipe';
import type { CreateCompetencyFrameworkRequest } from '../../../core/api/competency-frameworks/competency-frameworks-api.models';
import type { OrganizationListDto } from '../../../core/api/organizations/organizations-api.models';

/**
 * Add/Edit competency framework dialog. Lives in its own component so overlay + pointer
 * handling is isolated from the list page (avoids click-through reopening the modal).
 */
@Component({
  selector: 'app-competency-framework-modal',
  standalone: true,
  imports: [FormsModule, TranslateModule, PortalToBodyDirective, TooltipDirective, LocalizedTextPipe],
  templateUrl: './competency-framework-modal.component.html',
  styleUrl: './competency-framework-modal.component.scss',
})
export class CompetencyFrameworkModalComponent {
  open = input(false);
  /** Same object reference as parent page — ngModel mutates in place. */
  form = input.required<CreateCompetencyFrameworkRequest>();
  orgOptions = input.required<OrganizationListDto[]>();
  editingId = input<string | null>(null);
  modalError = input<string | null>(null);
  saving = input(false);

  dismissed = output<void>();
  saveRequested = output<void>();

  /**
   * Stops the gesture from reaching elements under the portaled overlay (click-through reopen).
   */
  requestDismiss(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    event?.stopImmediatePropagation();
    this.dismissed.emit();
  }
}
