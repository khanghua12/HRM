import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  template: `
    <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <ng-content />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalComponent {}
