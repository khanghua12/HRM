import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { EmailService } from '../../../../core/services/email.service';
import { PayrollService } from '../../../../core/services/payroll.service';
import { PayrollListRow, PayrollRecord } from '../../../../models/payroll.model';
import { VndCurrencyPipe } from '../../../../shared/pipes/vnd-currency.pipe';

interface PayrollEmployee extends PayrollListRow {
  period: string;
}

@Component({
  selector: 'app-payroll-list',
  standalone: true,
  imports: [RouterLink, VndCurrencyPipe],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 class="text-2xl font-semibold text-slate-900">Bảng lương nhân viên</h3>
          <p class="mt-1 text-sm text-slate-500">Chọn nhân viên để gửi phiếu lương hàng loạt.</p>
        </div>
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          [disabled]="isSending() || selectedCount() === 0"
          (click)="sendSelectedPayrolls()"
        >
          {{ isSending() ? 'Đang gửi...' : 'Gửi phiếu lương' }}
        </button>
      </div>

      <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50">
              <tr class="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th class="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    class="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    [checked]="allSelected()"
                    [indeterminate]="someSelected()"
                    (change)="toggleAll($event)"
                  />
                </th>
                <th class="px-4 py-3">STT</th>
                <th class="px-4 py-3">Tên nhân viên</th>
                <th class="px-4 py-3">Mã nhân viên</th>
                <th class="px-4 py-3">Phòng ban</th>
                <th class="px-4 py-3 text-right">Lương gross</th>
                <th class="px-4 py-3 text-right">Lương net</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              @for (employee of employees(); track employee.id; let i = $index) {
                <tr
                  class="cursor-pointer transition hover:bg-indigo-50/60"
                  (click)="goToDetail(employee.id)"
                >
                  <td class="px-4 py-4" (click)="$event.stopPropagation()">
                    <input
                      type="checkbox"
                      class="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      [checked]="selectedIds().has(employee.id)"
                      (change)="toggleSelection(employee.id, $event)"
                    />
                  </td>
                  <td class="px-4 py-4 text-sm text-slate-600">{{ i + 1 }}</td>
                  <td class="px-4 py-4 text-sm font-medium text-slate-900">{{ employee.employeeName }}</td>
                  <td class="px-4 py-4 text-sm text-slate-600">{{ employee.employeeCode }}</td>
                  <td class="px-4 py-4 text-sm text-slate-600">{{ employee.department }}</td>
                  <td class="px-4 py-4 text-right text-sm text-slate-900">{{ employee.grossSalary | vndCurrency }}</td>
                  <td class="px-4 py-4 text-right text-sm font-medium text-emerald-700">{{ employee.netSalary | vndCurrency }}</td>
                </tr>
              }
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

  readonly isSending = signal(false);
  readonly selectedIds = signal<Set<string>>(new Set<string>());

  private readonly mockEmployees = signal<PayrollEmployee[]>([
    this.createEmployee('pay-001', 'Nguyễn Minh Anh', 'EMP-001', 'Nhân sự', '2026-04'),
    this.createEmployee('pay-002', 'Trần Quốc Bảo', 'EMP-002', 'Kinh doanh', '2026-04'),
    this.createEmployee('pay-003', 'Lê Thu Hà', 'EMP-003', 'Tài chính', '2026-04'),
    this.createEmployee('pay-004', 'Phạm Gia Huy', 'EMP-004', 'Công nghệ', '2026-04')
  ]);

  readonly employees = computed(() => this.mockEmployees());
  readonly selectedCount = computed(() => this.selectedIds().size);
  readonly allSelected = computed(() => {
    const employees = this.employees();
    return employees.length > 0 && employees.every((employee) => this.selectedIds().has(employee.id));
  });
  readonly someSelected = computed(() => {
    const employees = this.employees();
    const count = employees.filter((employee) => this.selectedIds().has(employee.id)).length;
    return count > 0 && count < employees.length;
  });

  goToDetail(id: string): void {
    void this.router.navigate(['/payroll', id]);
  }

  toggleSelection(id: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const next = new Set(this.selectedIds());

    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }

    this.selectedIds.set(next);
  }

  toggleAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;

    if (!checked) {
      this.selectedIds.set(new Set<string>());
      return;
    }

    this.selectedIds.set(new Set(this.employees().map((employee) => employee.id)));
  }

  async sendSelectedPayrolls(): Promise<void> {
    if (this.isSending() || this.selectedCount() === 0) {
      return;
    }

    this.isSending.set(true);

    try {
      const selectedEmployees = this.employees().filter((employee) => this.selectedIds().has(employee.id));
      for (const employee of selectedEmployees) {
        const payroll = this.payrollService.calculateNetSalary(employee.grossSalary);
        const payload: PayrollRecord = {
          employeeId: employee.id,
          employeeName: employee.employeeName,
          grossSalary: employee.grossSalary,
          period: employee.period
        };
        this.emailService.sendPayrollEmail(payload, payroll);
      }

      alert('Gửi thành công');
    } finally {
      this.isSending.set(false);
    }
  }

  private createEmployee(
    id: string,
    employeeName: string,
    employeeCode: string,
    department: string,
    period: string
  ): PayrollEmployee {
    const grossSalary = this.grossSalaryFromCode(employeeCode);
    const payroll = this.payrollService.calculateNetSalary(grossSalary);

    return {
      id,
      employeeName,
      employeeCode,
      department,
      grossSalary,
      netSalary: payroll.netSalary,
      period
    };
  }

  private grossSalaryFromCode(code: string): number {
    const suffix = Number(code.split('-').pop() ?? '1');
    return 18_000_000 + suffix * 3_500_000;
  }
}
