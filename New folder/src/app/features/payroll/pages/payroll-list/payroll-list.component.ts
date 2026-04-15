import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PayrollService } from '../../../../core/services/payroll.service';
import { VndCurrencyPipe } from '../../../../shared/pipes/vnd-currency.pipe';
import { PAYROLL_EMPLOYEE_RECORDS } from '../../data/payroll.mock';
import { EmailService } from '../../services/email.service';
import { calculationResultToPayroll } from '../../utils/payroll-mapper';

@Component({
  selector: 'app-payroll-list',
  standalone: true,
  imports: [CommonModule, VndCurrencyPipe],
  template: `
    <div class="space-y-6">
      @if (toastMessage()) {
        <div
          class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 shadow-sm"
          role="status"
        >
          {{ toastMessage() }}
        </div>
      }

      <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 class="text-2xl font-semibold text-slate-900">Danh sách lương nhân viên</h3>
            <p class="mt-1 text-sm text-slate-500">Chọn nhân viên và gửi phiếu lương hàng loạt. Click dòng để xem chi tiết.</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="rounded-lg bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
              {{ records().length }} nhân viên
            </span>
            <span class="rounded-lg bg-slate-100 px-3 py-1 text-sm text-slate-600">
              Đã chọn: {{ selectedCount() }}
            </span>
            <button
              type="button"
              class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              [disabled]="selectedCount() === 0"
              (click)="sendPayrollSlips()"
            >
              Gửi phiếu lương
            </button>
          </div>
        </div>
      </section>

      <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 text-sm">
            <thead class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th class="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    class="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    [checked]="allSelected()"
                    (change)="onToggleAll($event)"
                    (click)="$event.stopPropagation()"
                    aria-label="Chọn tất cả"
                  />
                </th>
                <th class="px-4 py-3">Nhân viên</th>
                <th class="px-4 py-3">Mã NV</th>
                <th class="px-4 py-3">Phòng ban</th>
                <th class="px-4 py-3 text-right">Lương gross</th>
                <th class="px-4 py-3 text-right">Lương net</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              <tr
                *ngFor="let item of recordsView(); trackBy: trackByEmployeeId"
                class="cursor-pointer transition-colors hover:bg-indigo-50/70"
                (click)="openDetail(item.employee.id)"
              >
                <td class="px-4 py-3" (click)="$event.stopPropagation()">
                  <input
                    type="checkbox"
                    class="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    [checked]="isSelected(item.employee.id)"
                    (change)="onToggleOne(item.employee.id, $event)"
                    (click)="$event.stopPropagation()"
                    [attr.aria-label]="'Chọn ' + item.employee.name"
                  />
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <img
                      [src]="item.employee.avatar || defaultAvatar"
                      [alt]="item.employee.name"
                      class="h-10 w-10 rounded-lg border border-slate-200 object-cover"
                    />
                    <div>
                      <p class="font-medium text-slate-800">{{ item.employee.name }}</p>
                      <p class="text-xs text-slate-500">{{ item.employee.position }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3 font-medium text-slate-700">{{ item.employee.code }}</td>
                <td class="px-4 py-3 text-slate-700">{{ item.employee.department }}</td>
                <td class="px-4 py-3 text-right font-medium text-slate-700">
                  {{ item.grossSalary | vndCurrency }}
                </td>
                <td class="px-4 py-3 text-right font-semibold text-emerald-700">{{ item.netSalary | vndCurrency }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PayrollListComponent {
  private readonly router = inject(Router);
  private readonly payrollService = inject(PayrollService);
  private readonly emailService = inject(EmailService);

  readonly defaultAvatar = 'https://i.pravatar.cc/160?img=12';
  readonly records = signal(PAYROLL_EMPLOYEE_RECORDS);
  readonly selectedIds = signal<Set<number>>(new Set());
  readonly toastMessage = signal<string | null>(null);

  readonly recordsView = computed(() =>
    this.records().map((item) => ({
      ...item,
      netSalary: this.payrollService.calculateNetSalary(item.grossSalary).netSalary
    }))
  );

  readonly selectedCount = computed(() => this.selectedIds().size);

  readonly allSelected = computed(() => {
    const rows = this.records();
    if (rows.length === 0) return false;
    const sel = this.selectedIds();
    return rows.every((r) => sel.has(r.employee.id));
  });

  trackByEmployeeId = (_: number, item: { employee: { id: number } }) => item.employee.id;

  isSelected(id: number): boolean {
    return this.selectedIds().has(id);
  }

  onToggleOne(id: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const next = new Set(this.selectedIds());
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    this.selectedIds.set(next);
  }

  onToggleAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedIds.set(new Set(this.records().map((r) => r.employee.id)));
    } else {
      this.selectedIds.set(new Set());
    }
  }

  sendPayrollSlips(): void {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) {
      return;
    }

    for (const id of ids) {
      const row = this.records().find((r) => r.employee.id === id);
      if (!row) {
        continue;
      }
      const result = this.payrollService.calculateNetSalary(row.grossSalary);
      const payroll = calculationResultToPayroll(result);
      this.emailService.sendPayrollEmail(row.employee, payroll);
    }

    this.toastMessage.set('Đã gửi thành công');
    this.selectedIds.set(new Set());

    window.setTimeout(() => this.toastMessage.set(null), 4000);
  }

  openDetail(employeeId: number): void {
    void this.router.navigate(['/payroll', employeeId]);
  }
}
