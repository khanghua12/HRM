import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { map, switchMap } from 'rxjs';
import { HrmSettingsStore } from '../../services/hrm-settings.store';

type TabKey = 'departments' | 'titles' | 'workplaces';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [AsyncPipe, ReactiveFormsModule, LucideAngularModule],
  template: `
    <section class="space-y-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 class="text-base font-semibold text-slate-900">Thiết lập</h3>
          <p class="mt-1 text-xs text-slate-500">Danh mục nền tảng: phòng ban, chức danh, nơi làm việc (chuẩn HRM SaaS).</p>
        </div>
      </div>

      <div class="rounded-sm border border-slate-200 bg-white">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-3 py-2">
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="h-9 rounded px-3 text-sm"
              [class]="tab() === 'departments' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'"
              (click)="tab.set('departments')"
            >
              Phòng ban
            </button>
            <button
              type="button"
              class="h-9 rounded px-3 text-sm"
              [class]="tab() === 'titles' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'"
              (click)="tab.set('titles')"
            >
              Chức danh
            </button>
            <button
              type="button"
              class="h-9 rounded px-3 text-sm"
              [class]="tab() === 'workplaces' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'"
              (click)="tab.set('workplaces')"
            >
              Nơi làm việc
            </button>
          </div>

          <div class="flex items-center gap-2">
            <input
              class="h-9 rounded border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500"
              placeholder="Tìm..."
              [value]="q()"
              (input)="q.set($any($event.target).value)"
            />
            <button
              type="button"
              class="inline-flex h-9 items-center gap-2 rounded bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-500"
              (click)="openCreate()"
            >
              <lucide-icon name="settings" class="h-4 w-4"></lucide-icon>
              Thêm
            </button>
          </div>
        </div>

        <div class="p-3">
          @if (tab() === 'departments') {
            <div class="overflow-auto">
              <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th class="px-3 py-2">Mã</th>
                    <th class="px-3 py-2">Tên phòng ban</th>
                    <th class="px-3 py-2">Trạng thái</th>
                    <th class="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @if (departments$ | async; as rows) {
                    @for (r of rows; track r.id) {
                      <tr class="bg-white hover:bg-slate-50">
                        <td class="px-3 py-2 font-medium text-slate-900">{{ r.code }}</td>
                        <td class="px-3 py-2 text-slate-800">{{ r.name }}</td>
                        <td class="px-3 py-2">
                          <span class="rounded-full px-2.5 py-1 text-xs font-medium" [class]="r.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'">
                            {{ r.active ? 'Đang dùng' : 'Tạm ngưng' }}
                          </span>
                        </td>
                        <td class="px-3 py-2 text-right">
                          <button class="h-8 rounded border border-slate-200 bg-white px-2 text-xs hover:bg-slate-50" type="button" (click)="toggleDepartment(r.id)">
                            Đổi trạng thái
                          </button>
                        </td>
                      </tr>
                    }
                  }
                </tbody>
              </table>
            </div>
          } @else if (tab() === 'titles') {
            <div class="overflow-auto">
              <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th class="px-3 py-2">Chức danh</th>
                    <th class="px-3 py-2">Trạng thái</th>
                    <th class="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @if (titles$ | async; as rows) {
                    @for (r of rows; track r.id) {
                      <tr class="bg-white hover:bg-slate-50">
                        <td class="px-3 py-2 font-medium text-slate-900">{{ r.name }}</td>
                        <td class="px-3 py-2">
                          <span class="rounded-full px-2.5 py-1 text-xs font-medium" [class]="r.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'">
                            {{ r.active ? 'Đang dùng' : 'Tạm ngưng' }}
                          </span>
                        </td>
                        <td class="px-3 py-2 text-right">
                          <button class="h-8 rounded border border-slate-200 bg-white px-2 text-xs hover:bg-slate-50" type="button" (click)="toggleTitle(r.id)">
                            Đổi trạng thái
                          </button>
                        </td>
                      </tr>
                    }
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <div class="overflow-auto">
              <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th class="px-3 py-2">Nơi làm việc</th>
                    <th class="px-3 py-2">Trạng thái</th>
                    <th class="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @if (workplaces$ | async; as rows) {
                    @for (r of rows; track r.id) {
                      <tr class="bg-white hover:bg-slate-50">
                        <td class="px-3 py-2 font-medium text-slate-900">{{ r.name }}</td>
                        <td class="px-3 py-2">
                          <span class="rounded-full px-2.5 py-1 text-xs font-medium" [class]="r.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'">
                            {{ r.active ? 'Đang dùng' : 'Tạm ngưng' }}
                          </span>
                        </td>
                        <td class="px-3 py-2 text-right">
                          <button class="h-8 rounded border border-slate-200 bg-white px-2 text-xs hover:bg-slate-50" type="button" (click)="toggleWorkplace(r.id)">
                            Đổi trạng thái
                          </button>
                        </td>
                      </tr>
                    }
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>
    </section>

    @if (createOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" (click)="closeCreate()">
        <div class="w-full max-w-2xl rounded-lg border border-slate-200 bg-white p-4 shadow-lg" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-semibold text-slate-900">Thêm {{ tabLabel() }}</h4>
            <button class="rounded p-1 text-slate-500 hover:bg-slate-100" type="button" (click)="closeCreate()">✕</button>
          </div>

          <form class="mt-4" [formGroup]="createForm">
            <div class="grid grid-cols-1 gap-3 md:grid-cols-4">
              @if (tab() === 'departments') {
                <div>
                  <label class="text-xs text-slate-600">Mã</label>
                  <input class="mt-1 h-9 w-full rounded border border-slate-200 px-2 text-sm" formControlName="code" />
                </div>
                <div class="md:col-span-3">
                  <label class="text-xs text-slate-600">Tên</label>
                  <input class="mt-1 h-9 w-full rounded border border-slate-200 px-2 text-sm" formControlName="name" />
                </div>
              } @else {
                <div class="md:col-span-4">
                  <label class="text-xs text-slate-600">Tên</label>
                  <input class="mt-1 h-9 w-full rounded border border-slate-200 px-2 text-sm" formControlName="name" />
                </div>
              }
              <div class="md:col-span-4">
                <label class="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" class="h-4 w-4" formControlName="active" />
                  <span class="text-slate-700">Kích hoạt</span>
                </label>
              </div>
            </div>
          </form>

          <div class="mt-4 flex justify-end gap-2">
            <button class="h-9 rounded border border-slate-200 bg-white px-4 text-sm hover:bg-slate-50" type="button" (click)="closeCreate()">Huỷ</button>
            <button class="h-9 rounded bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50" type="button" [disabled]="createForm.invalid" (click)="submitCreate()">Lưu</button>
          </div>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent {
  private readonly store = inject(HrmSettingsStore);
  private readonly fb = inject(FormBuilder);

  readonly tab = signal<TabKey>('departments');
  readonly q = signal('');

  readonly departments$ = toObservable(this.q).pipe(switchMap((q) => this.store.listDepartments(q)));
  readonly titles$ = this.store.titles$;
  readonly workplaces$ = this.store.workplaces$;

  readonly createOpen = signal(false);
  readonly createForm = this.fb.nonNullable.group({
    code: [''],
    name: ['', Validators.required],
    active: [true]
  });

  tabLabel(): string {
    const t = this.tab();
    if (t === 'departments') return 'phòng ban';
    if (t === 'titles') return 'chức danh';
    return 'nơi làm việc';
  }

  openCreate(): void {
    this.createForm.reset({ code: '', name: '', active: true });
    this.createOpen.set(true);
  }
  closeCreate(): void {
    this.createOpen.set(false);
  }

  submitCreate(): void {
    const v = this.createForm.getRawValue();
    const t = this.tab();
    if (t === 'departments') {
      void this.store.addDepartment({ code: v.code || 'PB-NEW', name: v.name, active: v.active }).subscribe(() => this.closeCreate());
      return;
    }
    if (t === 'titles') {
      void this.store.addTitle({ name: v.name, active: v.active }).subscribe(() => this.closeCreate());
      return;
    }
    void this.store.addWorkplace({ name: v.name, active: v.active }).subscribe(() => this.closeCreate());
  }

  toggleDepartment(id: string): void {
    void this.store.toggleDepartment(id).subscribe();
  }
  toggleTitle(id: string): void {
    void this.store.toggleTitle(id).subscribe();
  }
  toggleWorkplace(id: string): void {
    void this.store.toggleWorkplace(id).subscribe();
  }
}

