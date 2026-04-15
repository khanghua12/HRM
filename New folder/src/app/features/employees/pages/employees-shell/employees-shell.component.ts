import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-employees-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-6">
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-slate-900">NHÂN SỰ</span>
          </div>

          <nav class="flex items-center gap-5 text-sm">
            @for (item of items; track item.path) {
              <a
                [routerLink]="item.path"
                routerLinkActive="text-slate-900"
                [routerLinkActiveOptions]="{ exact: true }"
                class="text-slate-500 hover:text-slate-900"
              >
                {{ item.label }}
              </a>
            }
          </nav>
        </div>
      </div>

      <router-outlet />
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeesShellComponent {
  readonly items = [
    { path: '/employees/tong-quan', label: 'Tổng quan' },
    { path: '/employees/ho-so', label: 'Hồ sơ' }
  ] as const;
}

