import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { EmailService } from '../../../../core/services/email.service';
import { PayrollService } from '../../../../core/services/payroll.service';
import { PayrollCalculationResult, PayrollRecord } from '../../../../models/payroll.model';
import { VndCurrencyPipe } from '../../../../shared/pipes/vnd-currency.pipe';

@Component({
  selector: 'app-payroll-detail',
  standalone: true,
  imports: [VndCurrencyPipe],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-start lg:justify-between">
        <div>
          <button
            type="button"
            class="mb-3 inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            (click)="goBack()"
          >
            ← Quay lại
          </button>
          <h3 class="text-2xl font-semibold text-slate-900">Chi tiết lương</h3>
          <p class="mt-1 text-sm text-slate-500">Tổng quan Gross → Net, BHXH/BHYT/BHTN và thuế TNCN.</p>
        </div>

        <div class="flex flex-wrap gap-3">
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100"
            [disabled]="isSending()"
            (click)="sendPayroll()"
          >
            {{ isSending() ? 'Đang gửi...' : 'Gửi phiếu lương' }}
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            [disabled]="isExporting()"
            (click)="exportPdf()"
          >
            {{ isExporting() ? 'Đang xuất...' : 'Xuất PDF' }}
          </button>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p class="text-xs uppercase text-slate-500">Lương gross</p>
          <p class="mt-2 text-xl font-semibold text-slate-900">{{ payroll().grossSalary | vndCurrency }}</p>
        </article>
        <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p class="text-xs uppercase text-slate-500">BHXH</p>
          <p class="mt-2 text-xl font-semibold text-slate-900">{{ payroll().insurance.bhxh | vndCurrency }}</p>
        </article>
        <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p class="text-xs uppercase text-slate-500">BHYT</p>
          <p class="mt-2 text-xl font-semibold text-slate-900">{{ payroll().insurance.bhyt | vndCurrency }}</p>
        </article>
        <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p class="text-xs uppercase text-slate-500">BHTN</p>
          <p class="mt-2 text-xl font-semibold text-slate-900">{{ payroll().insurance.bhtn | vndCurrency }}</p>
        </article>
        <article class="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <p class="text-xs uppercase text-emerald-700">Lương net</p>
          <p class="mt-2 text-xl font-semibold text-emerald-700">{{ payroll().netSalary | vndCurrency }}</p>
        </article>
      </div>

      <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h4 class="text-lg font-semibold text-slate-900">Xem trước lương (mô phỏng)</h4>
        <p class="mt-2 text-sm text-slate-600">
          Lương gross tháng:
          <span class="font-medium text-slate-900">{{ selectedGrossSalary() | vndCurrency }}</span>
        </p>
        <input
          type="range"
          min="10000000"
          max="100000000"
          step="500000"
          [value]="selectedGrossSalary()"
          (input)="onGrossSalaryChange($event)"
          class="mt-4 w-full accent-indigo-600"
        />
        <div class="mt-3 text-sm text-slate-600">
          Thuế TNCN:
          <span class="font-medium text-slate-900">{{ payroll().personalIncomeTax | vndCurrency }}</span>
        </div>
      </section>

      <section class="grid gap-4 lg:grid-cols-2">
        <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 class="text-base font-semibold text-slate-900">Chi tiết bảo hiểm</h4>
          <div class="mt-4 space-y-2 text-sm">
            <div class="flex justify-between">
              <span>BHXH (8%)</span>
              <span class="font-medium text-slate-900">{{ payroll().insurance.bhxh | vndCurrency }}</span>
            </div>
            <div class="flex justify-between">
              <span>BHYT (1,5%)</span>
              <span class="font-medium text-slate-900">{{ payroll().insurance.bhyt | vndCurrency }}</span>
            </div>
            <div class="flex justify-between">
              <span>BHTN (1%)</span>
              <span class="font-medium text-slate-900">{{ payroll().insurance.bhtn | vndCurrency }}</span>
            </div>
            <div class="mt-3 flex justify-between border-t border-slate-200 pt-3 font-semibold">
              <span>Tổng bảo hiểm</span>
              <span>{{ payroll().insurance.total | vndCurrency }}</span>
            </div>
          </div>
        </article>

        <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 class="text-base font-semibold text-slate-900">Bảng lương chi tiết</h4>
          <div class="mt-4 overflow-hidden rounded-xl border border-slate-200">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
              <tbody class="divide-y divide-slate-100 bg-white">
                <tr class="hover:bg-slate-50"><td class="px-4 py-3 text-slate-600">Gross</td><td class="px-4 py-3 text-right font-medium">{{ payroll().grossSalary | vndCurrency }}</td></tr>
                <tr class="hover:bg-slate-50"><td class="px-4 py-3 text-slate-600">BHXH</td><td class="px-4 py-3 text-right font-medium">{{ payroll().insurance.bhxh | vndCurrency }}</td></tr>
                <tr class="hover:bg-slate-50"><td class="px-4 py-3 text-slate-600">BHYT</td><td class="px-4 py-3 text-right font-medium">{{ payroll().insurance.bhyt | vndCurrency }}</td></tr>
                <tr class="hover:bg-slate-50"><td class="px-4 py-3 text-slate-600">BHTN</td><td class="px-4 py-3 text-right font-medium">{{ payroll().insurance.bhtn | vndCurrency }}</td></tr>
                <tr class="hover:bg-slate-50"><td class="px-4 py-3 text-slate-600">Thuế TNCN</td><td class="px-4 py-3 text-right font-medium">{{ payroll().personalIncomeTax | vndCurrency }}</td></tr>
                <tr class="bg-emerald-50 hover:bg-emerald-50"><td class="px-4 py-3 font-semibold text-emerald-700">Net</td><td class="px-4 py-3 text-right font-semibold text-emerald-700">{{ payroll().netSalary | vndCurrency }}</td></tr>
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PayrollDetailComponent {
  private readonly router = inject(Router);
  private readonly payrollService = inject(PayrollService);
  private readonly emailService = inject(EmailService);

  readonly isSending = signal(false);
  readonly isExporting = signal(false);
  readonly selectedGrossSalary = signal(35_000_000);
  readonly payroll = computed<PayrollCalculationResult>(() => this.payrollService.calculateNetSalary(this.selectedGrossSalary()));

  readonly employee = computed<PayrollRecord>(() => ({
    employeeId: 'payroll-detail',
    employeeName: 'Nhân viên mẫu',
    grossSalary: this.selectedGrossSalary(),
    period: '2026-04'
  }));

  goBack(): void {
    void this.router.navigate(['/payroll']);
  }

  sendPayroll(): void {
    if (this.isSending()) {
      return;
    }

    this.isSending.set(true);
    try {
      this.emailService.sendPayrollEmail(this.employee(), this.payroll());
      alert('Gửi thành công');
    } finally {
      this.isSending.set(false);
    }
  }

  exportPdf(): void {
    if (this.isExporting()) {
      return;
    }

    this.isExporting.set(true);
    try {
      console.log('Export PDF mock', this.employee(), this.payroll());
    } finally {
      this.isExporting.set(false);
    }
  }

  onGrossSalaryChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.selectedGrossSalary.set(Number(target.value));
  }
}
