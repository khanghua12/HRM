import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    LucideAngularModule
  ],
  template: `
    <div class="min-h-screen bg-slate-50 text-slate-900">
      <div class="flex min-h-screen">
        <aside class="w-72 border-r border-slate-200 bg-white p-5 shadow-sm">
          <h1 class="mb-1 text-xl font-bold text-indigo-600">HRM Suite</h1>
          <p class="mb-8 text-xs text-slate-500">Vận hành nguồn lực doanh nghiệp</p>
          <nav class="space-y-2">
            @for (item of navItems; track item.path) {
              <a
                [routerLink]="item.path"
                routerLinkActive="bg-indigo-50 text-indigo-700"
                class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                <lucide-icon [name]="item.icon" class="h-4 w-4"></lucide-icon>
                <span>{{ item.label }}</span>
              </a>
            }
          </nav>
        </aside>
        <main class="flex-1">
          <header class="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4 shadow-sm">
            <div>
              <h2 class="text-lg font-semibold">Quản trị nhân sự</h2>
              <p class="text-xs text-slate-500">Bảng điều khiển tập trung cho bộ phận nhân sự</p>
            </div>
            <div class="flex items-center gap-3">
              <label class="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <lucide-icon name="search" class="h-4 w-4 text-slate-500"></lucide-icon>
                <input
                  class="w-52 border-0 bg-transparent text-sm outline-none"
                  placeholder="Tìm nhân viên..."
                />
              </label>
              <button
                class="relative rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
              >
                <lucide-icon name="bell" class="h-4 w-4"></lucide-icon>
                <span class="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-rose-500"></span>
              </button>
              <div class="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium">
                {{ auth.displayName() }}
              </div>
              <button
                type="button"
                (click)="signOut()"
                class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <lucide-icon name="log-out" class="h-4 w-4"></lucide-icon>
                Đăng xuất
              </button>
            </div>
          </header>
          <section class="p-8">
            <router-outlet />
          </section>
        </main>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainLayoutComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly navItems = [
    { path: '/employees', label: 'Nhân viên', icon: 'users' },
    { path: '/recruitment', label: 'Tuyển dụng', icon: 'briefcase' },
    { path: '/payroll', label: 'Lương & phúc lợi', icon: 'wallet' },
    { path: '/performance', label: 'Hiệu suất & KPI', icon: 'chart-column' },
    { path: '/training', label: 'Đào tạo', icon: 'graduation-cap' }
  ];

  signOut(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
