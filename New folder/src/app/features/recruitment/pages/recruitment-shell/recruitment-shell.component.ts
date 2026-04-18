import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-recruitment-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <section class="space-y-4">
      <div class="flex items-center gap-6">
        <span class="text-sm font-semibold text-slate-900">TUYỂN DỤNG</span>
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
      <router-outlet />
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecruitmentShellComponent {
  readonly items = [
    { path: '/recruitment/dashboard', label: 'Dashboard' },
    { path: '/recruitment/candidates', label: 'Hồ sơ ứng viên' },
    { path: '/recruitment/integrations', label: 'Google Sheet' },
    { path: '/recruitment/publisher', label: 'Facebook Page' }
  ] as const;
}

