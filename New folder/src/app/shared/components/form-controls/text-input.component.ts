import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-text-input',
  standalone: true,
  imports: [FormsModule],
  template: `
    <label class="block text-sm font-medium text-slate-600">{{ label() }}</label>
    <input
      class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
      [placeholder]="placeholder()"
      [(ngModel)]="value"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextInputComponent {
  readonly label = input<string>('Nhãn');
  readonly placeholder = input<string>('');
  value = '';
}
