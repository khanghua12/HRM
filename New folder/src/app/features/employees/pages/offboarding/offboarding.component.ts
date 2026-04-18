import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { combineLatest, map, switchMap } from 'rxjs';
import { StatusBadgePipe } from '../../../../shared/pipes/status-badge.pipe';
import type { OffboardingStatus } from '../../models/offboarding.model';
import { OffboardingStore } from '../../services/offboarding.store';

@Component({
  selector: 'app-offboarding',
  standalone: true,
  imports: [AsyncPipe, ReactiveFormsModule, LucideAngularModule, StatusBadgePipe],
  template: `
    <section class="space-y-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 class="text-base font-semibold text-slate-900">Nghỉ việc (Offboarding)</h3>
          <p class="mt-1 text-xs text-slate-500">Chuẩn thị trường: bàn giao → thu hồi tài sản → chốt công nợ → hoàn tất.</p>
        </div>
        <button
          type="button"
          class="inline-flex h-9 items-center gap-2 rounded bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-500"
          (click)="openCreate()"
        >
          <lucide-icon name="users" class="h-4 w-4"></lucide-icon>
          Tạo hồ sơ nghỉ việc
        </button>
      </div>

      <div class="rounded-sm border border-slate-200 bg-white p-3">
        <div class="grid gap-2 md:grid-cols-4">
          <input
            class="h-9 rounded border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500"
            placeholder="Tìm theo tên/phòng ban..."
            [value]="q()"
            (input)="q.set($any($event.target).value)"
          />
          <select
            class="h-9 rounded border border-slate-200 bg-white px-2 text-sm outline-none focus:border-indigo-500"
            [value]="status()"
            (change)="status.set($any($event.target).value)"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="initiated">Khởi tạo</option>
            <option value="handover">Bàn giao</option>
            <option value="clearance">Thanh lý</option>
            <option value="completed">Hoàn tất</option>
            <option value="cancelled">Huỷ</option>
          </select>
          <div class="md:col-span-2 flex justify-end">
            <button class="h-9 rounded border border-slate-200 bg-white px-3 text-sm hover:bg-slate-50" type="button" (click)="reset()">
              Reset
            </button>
          </div>
        </div>
      </div>

      <div class="rounded-sm border border-slate-200 bg-white">
        <div class="overflow-auto">
          <table class="min-w-full divide-y divide-slate-200 text-sm">
            <thead class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th class="px-3 py-2">Nhân viên</th>
                <th class="px-3 py-2">Phòng ban</th>
                <th class="px-3 py-2">Ngày làm cuối</th>
                <th class="px-3 py-2">Trạng thái</th>
                <th class="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @if (rows$ | async; as rows) {
                @for (r of rows; track r.id) {
                  <tr class="bg-white hover:bg-slate-50">
                    <td class="px-3 py-2 font-medium text-slate-900">{{ r.employeeName }}</td>
                    <td class="px-3 py-2 text-slate-700">{{ r.department }}</td>
                    <td class="px-3 py-2 text-slate-700">{{ r.lastWorkingDate }}</td>
                    <td class="px-3 py-2">
                      <span class="rounded-full px-2.5 py-1 text-xs font-medium" [class]="r.status | statusBadge">{{
                        statusLabel(r.status)
                      }}</span>
                    </td>
                    <td class="px-3 py-2 text-right">
                      <div class="inline-flex gap-1">
                        <button class="h-8 rounded border border-slate-200 bg-white px-2 text-xs hover:bg-slate-50" type="button" (click)="next(r.id, r.status)">
                          Tiến độ
                        </button>
                      </div>
                    </td>
                  </tr>
                }
                @if (rows.length === 0) {
                  <tr><td colspan="5" class="px-3 py-8 text-center text-slate-500">Không có hồ sơ.</td></tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>
    </section>

    @if (createOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" (click)="closeCreate()">
        <div class="w-full max-w-3xl rounded-lg border border-slate-200 bg-white p-4 shadow-lg" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-semibold text-slate-900">Tạo hồ sơ nghỉ việc</h4>
            <button class="rounded p-1 text-slate-500 hover:bg-slate-100" type="button" (click)="closeCreate()">✕</button>
          </div>

          <form class="mt-4" [formGroup]="createForm">
            <div class="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div class="md:col-span-2">
                <label class="text-xs text-slate-600">Nhân viên</label>
                <input class="mt-1 h-9 w-full rounded border border-slate-200 px-2 text-sm" formControlName="employeeName" />
              </div>
              <div>
                <label class="text-xs text-slate-600">Phòng ban</label>
                <input class="mt-1 h-9 w-full rounded border border-slate-200 px-2 text-sm" formControlName="department" />
              </div>
              <div>
                <label class="text-xs text-slate-600">Ngày làm cuối</label>
                <input type="date" class="mt-1 h-9 w-full rounded border border-slate-200 px-2 text-sm" formControlName="lastWorkingDate" />
              </div>
            </div>
          </form>

          <div class="mt-4 flex justify-end gap-2">
            <button class="h-9 rounded border border-slate-200 bg-white px-4 text-sm hover:bg-slate-50" type="button" (click)="closeCreate()">Huỷ</button>
            <button class="h-9 rounded bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50" type="button" [disabled]="createForm.invalid" (click)="submitCreate()">
              Tạo
            </button>
          </div>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OffboardingComponent {
  private readonly store = inject(OffboardingStore);
  private readonly fb = inject(FormBuilder);

  readonly q = signal('');
  readonly status = signal<OffboardingStatus | ''>('');

  readonly rows$ = combineLatest([toObservable(this.q), toObservable(this.status)]).pipe(
    map(() => ({ q: this.q(), status: this.status() })),
    switchMap((f) => this.store.list(f))
  );

  readonly createOpen = signal(false);
  readonly createForm = this.fb.nonNullable.group({
    employeeName: ['', Validators.required],
    department: ['', Validators.required],
    lastWorkingDate: ['', Validators.required]
  });

  reset(): void {
    this.q.set('');
    this.status.set('');
  }

  openCreate(): void {
    this.createForm.reset({ employeeName: '', department: '', lastWorkingDate: '' });
    this.createOpen.set(true);
  }
  closeCreate(): void {
    this.createOpen.set(false);
  }
  submitCreate(): void {
    const v = this.createForm.getRawValue();
    void this.store
      .create({
        employeeId: 'EMP-NEW',
        employeeName: v.employeeName,
        department: v.department,
        lastWorkingDate: v.lastWorkingDate,
        reason: 'resign',
        status: 'initiated',
        handoverOwner: null
      })
      .subscribe(() => this.closeCreate());
  }

  next(id: string, st: OffboardingStatus): void {
    const flow: OffboardingStatus[] = ['initiated', 'handover', 'clearance', 'completed'];
    const idx = flow.indexOf(st);
    const next = idx >= 0 && idx < flow.length - 1 ? flow[idx + 1] : st;
    this.store.updateStatus(id, next);
  }

  statusLabel(s: OffboardingStatus): string {
    const m: Record<OffboardingStatus, string> = {
      initiated: 'Khởi tạo',
      handover: 'Bàn giao',
      clearance: 'Thanh lý',
      completed: 'Hoàn tất',
      cancelled: 'Huỷ'
    };
    return m[s] ?? s;
  }
}

