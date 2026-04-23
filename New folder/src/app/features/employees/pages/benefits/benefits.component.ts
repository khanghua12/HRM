import { AsyncPipe, CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { combineLatest, map, switchMap } from 'rxjs';
import { StatusBadgePipe } from '../../../../shared/pipes/status-badge.pipe';
import type { BenefitCategory, BenefitClaimStatus } from '../../models/benefit.model';
import { BenefitStore } from '../../services/benefit.store';

@Component({
  selector: 'app-benefits',
  standalone: true,
  imports: [AsyncPipe, CurrencyPipe, DatePipe, ReactiveFormsModule, LucideAngularModule, StatusBadgePipe],
  template: `
    <section class="space-y-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 class="text-base font-semibold text-slate-900">Phúc lợi</h3>
          <p class="mt-1 text-xs text-slate-500">Quản lý gói phúc lợi và xử lý yêu cầu/claim (chuẩn mô hình HR hiện nay).</p>
        </div>
        <button
          type="button"
          class="inline-flex h-9 items-center gap-2 rounded bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-500"
          (click)="openNewPlan()"
        >
          <lucide-icon name="wallet" class="h-4 w-4"></lucide-icon>
          Thêm gói phúc lợi
        </button>
      </div>

      <div class="grid gap-4 xl:grid-cols-2">
        <!-- Plans -->
        <div class="rounded-sm border border-slate-200 bg-white">
          <div class="flex items-center justify-between border-b border-slate-200 px-3 py-2">
            <h4 class="text-sm font-semibold text-slate-900">Gói phúc lợi</h4>
            <div class="flex items-center gap-2">
              <select
                class="h-9 rounded border border-slate-200 bg-white px-2 text-sm outline-none focus:border-indigo-500"
                [value]="planCategory()"
                (change)="planCategory.set($any($event.target).value)"
              >
                <option value="">Tất cả nhóm</option>
                <option value="health">Sức khoẻ</option>
                <option value="meal">Ăn uống</option>
                <option value="insurance">Bảo hiểm</option>
                <option value="allowance">Phụ cấp</option>
                <option value="other">Khác</option>
              </select>
              <select
                class="h-9 rounded border border-slate-200 bg-white px-2 text-sm outline-none focus:border-indigo-500"
                [value]="planEnabled()"
                (change)="planEnabled.set($any($event.target).value)"
              >
                <option value="">Tất cả</option>
                <option value="true">Đang bật</option>
                <option value="false">Đang tắt</option>
              </select>
            </div>
          </div>
          <div class="overflow-auto">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
              <thead class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th class="px-3 py-2">Tên gói</th>
                  <th class="px-3 py-2">Nhóm</th>
                  <th class="px-3 py-2">Ngân sách/tháng</th>
                  <th class="px-3 py-2">Trạng thái</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @if (plans$ | async; as rows) {
                  @for (p of rows; track p.id) {
                    <tr class="bg-white hover:bg-slate-50">
                      <td class="px-3 py-2 font-medium text-slate-900">{{ p.name }}</td>
                      <td class="px-3 py-2 text-slate-700">{{ categoryLabel(p.category) }}</td>
                      <td class="px-3 py-2 text-slate-700">{{ p.monthlyBudget | currency:'VND':'symbol':'1.0-0' }}</td>
                      <td class="px-3 py-2">
                        <span
                          class="rounded-full px-2.5 py-1 text-xs font-medium"
                          [class]="p.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'"
                        >
                          {{ p.enabled ? 'Bật' : 'Tắt' }}
                        </span>
                      </td>
                    </tr>
                  }
                  @if (rows.length === 0) {
                    <tr><td colspan="4" class="px-3 py-8 text-center text-slate-500">Không có gói phúc lợi.</td></tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Claims -->
        <div class="rounded-sm border border-slate-200 bg-white">
          <div class="flex items-center justify-between border-b border-slate-200 px-3 py-2">
            <h4 class="text-sm font-semibold text-slate-900">Yêu cầu/Claim</h4>
            <div class="flex items-center gap-2">
              <input
                class="h-9 rounded border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500"
                placeholder="Tìm theo nhân viên/gói..."
                [value]="claimQ()"
                (input)="claimQ.set($any($event.target).value)"
              />
              <select
                class="h-9 rounded border border-slate-200 bg-white px-2 text-sm outline-none focus:border-indigo-500"
                [value]="claimStatus()"
                (change)="claimStatus.set($any($event.target).value)"
              >
                <option value="">Tất cả</option>
                <option value="new">Mới</option>
                <option value="processing">Đang xử lý</option>
                <option value="approved">Đã duyệt</option>
                <option value="rejected">Từ chối</option>
                <option value="paid">Đã chi</option>
              </select>
            </div>
          </div>
          <div class="overflow-auto">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
              <thead class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th class="px-3 py-2">Nhân viên</th>
                  <th class="px-3 py-2">Gói</th>
                  <th class="px-3 py-2">Số tiền</th>
                  <th class="px-3 py-2">Ngày gửi</th>
                  <th class="px-3 py-2">Trạng thái</th>
                  <th class="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @if (claims$ | async; as rows) {
                  @for (c of rows; track c.id) {
                    <tr class="bg-white hover:bg-slate-50">
                      <td class="px-3 py-2 font-medium text-slate-900">{{ c.employeeName }}</td>
                      <td class="px-3 py-2 text-slate-700">{{ c.planName }}</td>
                      <td class="px-3 py-2 text-slate-700">{{ c.amount | currency:'VND':'symbol':'1.0-0' }}</td>
                      <td class="px-3 py-2 text-slate-700">{{ c.submittedAt | date:'dd/MM/yyyy' }}</td>
                      <td class="px-3 py-2">
                        <span class="rounded-full px-2.5 py-1 text-xs font-medium" [class]="c.status | statusBadge">
                          {{ claimStatusLabel(c.status) }}
                        </span>
                      </td>
                      <td class="px-3 py-2 text-right">
                        <div class="inline-flex gap-1">
                          <button class="h-8 rounded border border-slate-200 bg-white px-2 text-xs hover:bg-slate-50" type="button" (click)="setClaim(c.id, 'approved')">
                            Duyệt
                          </button>
                          <button class="h-8 rounded border border-slate-200 bg-white px-2 text-xs hover:bg-slate-50" type="button" (click)="setClaim(c.id, 'paid')">
                            Chi
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                  @if (rows.length === 0) {
                    <tr><td colspan="6" class="px-3 py-8 text-center text-slate-500">Không có yêu cầu.</td></tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    @if (newPlanOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" (click)="closeNewPlan()">
        <div class="w-full max-w-2xl rounded-lg border border-slate-200 bg-white p-4 shadow-lg" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-semibold text-slate-900">Thêm gói phúc lợi</h4>
            <button class="rounded p-1 text-slate-500 hover:bg-slate-100" type="button" (click)="closeNewPlan()">✕</button>
          </div>

          <form class="mt-4" [formGroup]="newPlanForm">
            <div class="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div class="md:col-span-2">
                <label class="text-xs text-slate-600">Tên gói</label>
                <input class="mt-1 h-9 w-full rounded border border-slate-200 px-2 text-sm" formControlName="name" />
              </div>
              <div>
                <label class="text-xs text-slate-600">Nhóm</label>
                <select class="mt-1 h-9 w-full rounded border border-slate-200 bg-white px-2 text-sm" formControlName="category">
                  <option value="health">Sức khoẻ</option>
                  <option value="meal">Ăn uống</option>
                  <option value="insurance">Bảo hiểm</option>
                  <option value="allowance">Phụ cấp</option>
                  <option value="other">Khác</option>
                </select>
              </div>
              <div>
                <label class="text-xs text-slate-600">Ngân sách/tháng (VND)</label>
                <input type="number" class="mt-1 h-9 w-full rounded border border-slate-200 px-2 text-sm" formControlName="monthlyBudget" />
              </div>
              <div class="md:col-span-4">
                <label class="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" class="h-4 w-4" formControlName="enabled" />
                  <span class="text-slate-700">Kích hoạt ngay</span>
                </label>
              </div>
            </div>
          </form>

          <div class="mt-4 flex justify-end gap-2">
            <button class="h-9 rounded border border-slate-200 bg-white px-4 text-sm hover:bg-slate-50" type="button" (click)="closeNewPlan()">
              Huỷ
            </button>
            <button
              class="h-9 rounded bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
              type="button"
              [disabled]="newPlanForm.invalid"
              (click)="submitNewPlan()"
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
export class BenefitsComponent {
  private readonly store = inject(BenefitStore);
  private readonly fb = inject(FormBuilder);

  readonly planCategory = signal<BenefitCategory | ''>('');
  readonly planEnabled = signal<string>(''); // '', 'true', 'false'

  readonly claimQ = signal('');
  readonly claimStatus = signal<BenefitClaimStatus | ''>('');

  readonly plans$ = combineLatest([toObservable(this.planCategory), toObservable(this.planEnabled)]).pipe(
    map(() => ({
      category: this.planCategory(),
      enabled: this.planEnabled() === '' ? null : this.planEnabled() === 'true'
    })),
    switchMap((f) => this.store.listPlans(f))
  );

  readonly claims$ = combineLatest([toObservable(this.claimQ), toObservable(this.claimStatus)]).pipe(
    map(() => ({ q: this.claimQ(), status: this.claimStatus() })),
    switchMap((f) => this.store.listClaims(f))
  );

  readonly newPlanOpen = signal(false);
  readonly newPlanForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    category: this.fb.nonNullable.control<BenefitCategory>('health', Validators.required),
    monthlyBudget: [0, [Validators.required, Validators.min(0)]],
    enabled: [true]
  });

  openNewPlan(): void {
    this.newPlanForm.reset({ name: '', category: 'health', monthlyBudget: 0, enabled: true });
    this.newPlanOpen.set(true);
  }
  closeNewPlan(): void {
    this.newPlanOpen.set(false);
  }
  submitNewPlan(): void {
    const v = this.newPlanForm.getRawValue();
    void this.store.createPlan(v).subscribe(() => this.closeNewPlan());
  }

  setClaim(id: string, status: BenefitClaimStatus): void {
    void this.store.setClaimStatus(id, status).subscribe();
  }

  categoryLabel(c: BenefitCategory): string {
    const m: Record<BenefitCategory, string> = {
      health: 'Sức khoẻ',
      meal: 'Ăn uống',
      insurance: 'Bảo hiểm',
      allowance: 'Phụ cấp',
      other: 'Khác'
    };
    return m[c] ?? c;
  }

  claimStatusLabel(s: BenefitClaimStatus): string {
    const m: Record<BenefitClaimStatus, string> = {
      new: 'Mới',
      processing: 'Đang xử lý',
      approved: 'Đã duyệt',
      rejected: 'Từ chối',
      paid: 'Đã chi'
    };
    return m[s] ?? s;
  }
}

