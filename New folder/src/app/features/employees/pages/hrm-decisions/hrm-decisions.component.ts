import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { combineLatest, map, switchMap } from 'rxjs';
import { StatusBadgePipe } from '../../../../shared/pipes/status-badge.pipe';
import type { HrmDecisionStatus, HrmDecisionType } from '../../models/hrm-decision.model';
import { HrmDecisionStore } from '../../services/hrm-decision.store';

@Component({
  selector: 'app-hrm-decisions',
  standalone: true,
  imports: [AsyncPipe, ReactiveFormsModule, LucideAngularModule, StatusBadgePipe],
  template: `
    <section class="space-y-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 class="text-base font-semibold text-slate-900">Quyết định nhân sự</h3>
          <p class="mt-1 text-xs text-slate-500">Quy trình duyệt số hoá: tạo → trình ký → hiệu lực → lưu trữ.</p>
        </div>
        <button
          type="button"
          class="inline-flex h-9 items-center gap-2 rounded bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-500"
          (click)="openCreate()"
        >
          <lucide-icon name="briefcase" class="h-4 w-4"></lucide-icon>
          Tạo quyết định
        </button>
      </div>

      <div class="rounded-sm border border-slate-200 bg-white p-3">
        <div class="grid gap-2 md:grid-cols-4">
          <input
            class="h-9 rounded border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500"
            placeholder="Tìm theo mã, nhân viên..."
            [value]="q()"
            (input)="q.set($any($event.target).value)"
          />
          <select
            class="h-9 rounded border border-slate-200 bg-white px-2 text-sm outline-none focus:border-indigo-500"
            [value]="type()"
            (change)="type.set($any($event.target).value)"
          >
            <option value="">Tất cả loại</option>
            <option value="transfer">Điều động</option>
            <option value="appoint">Bổ nhiệm</option>
            <option value="discipline">Kỷ luật</option>
            <option value="reward">Khen thưởng</option>
            <option value="salary-adjustment">Điều chỉnh lương</option>
          </select>
          <select
            class="h-9 rounded border border-slate-200 bg-white px-2 text-sm outline-none focus:border-indigo-500"
            [value]="status()"
            (change)="status.set($any($event.target).value)"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="draft">Nháp</option>
            <option value="pending">Chờ duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Từ chối</option>
            <option value="effective">Có hiệu lực</option>
          </select>
          <div class="flex items-center justify-end gap-2">
            <button
              type="button"
              class="h-9 rounded border border-slate-200 bg-white px-3 text-sm hover:bg-slate-50"
              (click)="reset()"
            >
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
                <th class="px-3 py-2">Mã</th>
                <th class="px-3 py-2">Loại</th>
                <th class="px-3 py-2">Nhân viên</th>
                <th class="px-3 py-2">Hiệu lực</th>
                <th class="px-3 py-2">Trạng thái</th>
                <th class="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @if (rows$ | async; as rows) {
                @for (r of rows; track r.id) {
                  <tr class="bg-white hover:bg-slate-50">
                    <td class="px-3 py-2 font-medium text-slate-900">{{ r.code }}</td>
                    <td class="px-3 py-2 text-slate-700">{{ typeLabel(r.type) }}</td>
                    <td class="px-3 py-2 text-slate-800">{{ r.employeeName }}</td>
                    <td class="px-3 py-2 text-slate-700">{{ r.effectiveDate }}</td>
                    <td class="px-3 py-2">
                      <span class="rounded-full px-2.5 py-1 text-xs font-medium" [class]="r.status | statusBadge">
                        {{ statusLabel(r.status) }}
                      </span>
                    </td>
                    <td class="px-3 py-2 text-right">
                      <div class="inline-flex gap-1">
                        <button
                          type="button"
                          class="h-8 rounded border border-slate-200 bg-white px-2 text-xs hover:bg-slate-50"
                          (click)="approve(r.id)"
                        >
                          Duyệt
                        </button>
                        <button
                          type="button"
                          class="h-8 rounded border border-slate-200 bg-white px-2 text-xs hover:bg-slate-50"
                          (click)="reject(r.id)"
                        >
                          Từ chối
                        </button>
                      </div>
                    </td>
                  </tr>
                }
                @if (rows.length === 0) {
                  <tr>
                    <td colspan="6" class="px-3 py-8 text-center text-slate-500">Không có dữ liệu.</td>
                  </tr>
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
            <div>
              <h4 class="text-sm font-semibold text-slate-900">Tạo quyết định</h4>
              <p class="mt-1 text-xs text-slate-500">Mẫu tối giản theo thực tế: loại, nhân viên, ngày hiệu lực, ghi chú.</p>
            </div>
            <button class="rounded p-1 text-slate-500 hover:bg-slate-100" type="button" (click)="closeCreate()">✕</button>
          </div>

          <form class="mt-4" [formGroup]="createForm">
            <div class="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div>
                <label class="text-xs text-slate-600">Loại</label>
                <select class="mt-1 h-9 w-full rounded border border-slate-200 bg-white px-2 text-sm" formControlName="type">
                  <option value="transfer">Điều động</option>
                  <option value="appoint">Bổ nhiệm</option>
                  <option value="discipline">Kỷ luật</option>
                  <option value="reward">Khen thưởng</option>
                  <option value="salary-adjustment">Điều chỉnh lương</option>
                </select>
              </div>
              <div class="md:col-span-2">
                <label class="text-xs text-slate-600">Nhân viên</label>
                <input class="mt-1 h-9 w-full rounded border border-slate-200 px-2 text-sm" formControlName="employeeName" placeholder="Ví dụ: Nguyễn Văn A" />
              </div>
              <div>
                <label class="text-xs text-slate-600">Ngày hiệu lực</label>
                <input type="date" class="mt-1 h-9 w-full rounded border border-slate-200 px-2 text-sm" formControlName="effectiveDate" />
              </div>
              <div class="md:col-span-4">
                <label class="text-xs text-slate-600">Ghi chú</label>
                <input class="mt-1 h-9 w-full rounded border border-slate-200 px-2 text-sm" formControlName="note" />
              </div>
            </div>
          </form>

          <div class="mt-4 flex justify-end gap-2">
            <button class="h-9 rounded border border-slate-200 bg-white px-4 text-sm hover:bg-slate-50" type="button" (click)="closeCreate()">
              Huỷ
            </button>
            <button
              class="h-9 rounded bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
              type="button"
              [disabled]="createForm.invalid"
              (click)="submitCreate()"
            >
              Tạo
            </button>
          </div>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HrmDecisionsComponent {
  private readonly store = inject(HrmDecisionStore);
  private readonly fb = inject(FormBuilder);

  readonly q = signal('');
  readonly type = signal<HrmDecisionType | ''>('');
  readonly status = signal<HrmDecisionStatus | ''>('');

  readonly rows$ = combineLatest([toObservable(this.q), toObservable(this.type), toObservable(this.status)]).pipe(
    map(() => ({ q: this.q(), type: this.type(), status: this.status() })),
    switchMap((f) => this.store.list(f))
  );

  readonly createOpen = signal(false);
  readonly createForm = this.fb.nonNullable.group({
    type: this.fb.nonNullable.control<HrmDecisionType>('transfer', Validators.required),
    employeeName: ['', Validators.required],
    effectiveDate: ['', Validators.required],
    note: ['']
  });

  openCreate(): void {
    this.createForm.reset({ type: 'transfer', employeeName: '', effectiveDate: '', note: '' });
    this.createOpen.set(true);
  }
  closeCreate(): void {
    this.createOpen.set(false);
  }

  reset(): void {
    this.q.set('');
    this.type.set('');
    this.status.set('');
  }

  approve(id: string): void {
    void this.store.updateStatus(id, 'approved').subscribe();
  }
  reject(id: string): void {
    void this.store.updateStatus(id, 'rejected').subscribe();
  }

  submitCreate(): void {
    const v = this.createForm.getRawValue();
    void this.store
      .create({
        code: `QD-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        type: v.type,
        employeeId: 'EMP-NEW',
        employeeName: v.employeeName,
        departmentFrom: null,
        departmentTo: null,
        titleFrom: null,
        titleTo: null,
        effectiveDate: v.effectiveDate,
        status: 'draft',
        note: v.note
      })
      .subscribe(() => this.closeCreate());
  }

  typeLabel(t: HrmDecisionType): string {
    const m: Record<HrmDecisionType, string> = {
      transfer: 'Điều động',
      appoint: 'Bổ nhiệm',
      discipline: 'Kỷ luật',
      reward: 'Khen thưởng',
      'salary-adjustment': 'Điều chỉnh lương'
    };
    return m[t] ?? t;
  }
  statusLabel(s: HrmDecisionStatus): string {
    const m: Record<HrmDecisionStatus, string> = {
      draft: 'Nháp',
      pending: 'Chờ duyệt',
      approved: 'Đã duyệt',
      rejected: 'Từ chối',
      effective: 'Có hiệu lực'
    };
    return m[s] ?? s;
  }
}

