import { Component, input } from '@angular/core';

@Component({
  selector: 'app-lux-data-card-grid',
  standalone: true,
  template: `
    <div class="lux-dc-grid" [class.lux-dc-grid--dense]="dense()">
      <ng-content />
    </div>
  `,
  styleUrl: './lux-data-card-grid.component.scss',
})
export class LuxDataCardGridComponent {
  dense = input(false);
}
