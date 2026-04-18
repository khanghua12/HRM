import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-table',
  standalone: true,
  template: `
    <div class="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <ng-content />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableComponent {}
