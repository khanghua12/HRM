import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div class="mb-8 text-center">
          <div
            class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white"
          >
            <lucide-icon name="shield-check" class="h-7 w-7"></lucide-icon>
          </div>
          <h1 class="text-2xl font-bold text-slate-900">Đăng nhập hệ thống</h1>
          <p class="mt-2 text-sm text-slate-500">Nhập tài khoản doanh nghiệp của bạn</p>
        </div>

        <form class="space-y-5" (ngSubmit)="onSubmit()">
          @if (error()) {
            <div
              class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
              role="alert"
            >
              {{ error() }}
            </div>
          }

          <div>
            <label for="email" class="block text-sm font-medium text-slate-700">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autocomplete="username"
              [(ngModel)]="email"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="admin@hrm.local"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-slate-700">Mật khẩu</label>
            <input
              id="password"
              name="password"
              type="password"
              autocomplete="current-password"
              [(ngModel)]="password"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            [disabled]="submitting()"
            class="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            @if (submitting()) {
              <span>Đang đăng nhập…</span>
            } @else {
              <lucide-icon name="log-in" class="h-4 w-4"></lucide-icon>
              <span>Đăng nhập</span>
            }
          </button>
        </form>

        <p class="mt-6 rounded-lg bg-slate-50 p-3 text-center text-xs text-slate-500">
          Demo:
          <span class="font-mono text-slate-700">admin@hrm.local</span>
          /
          <span class="font-mono text-slate-700">admin123</span>
        </p>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  email = 'admin@hrm.local';
  password = '';

  readonly error = signal<string | null>(null);
  readonly submitting = signal(false);

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router
  ) {}

  async onSubmit(): Promise<void> {
    this.error.set(null);
    if (!this.email.trim() || !this.password) {
      this.error.set('Vui lòng nhập email và mật khẩu.');
      return;
    }
    this.submitting.set(true);
    const result = await this.auth.login(this.email, this.password);
    this.submitting.set(false);
    if (result.ok) {
      await this.router.navigateByUrl('/');
      return;
    }
    this.error.set(result.message);
  }
}
