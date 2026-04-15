import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { PayrollService } from '../../../../core/services/payroll.service';
import { VndCurrencyPipe } from '../../../../shared/pipes/vnd-currency.pipe';

@Component({
  selector: 'app-payroll-detail',
  standalone: true,
  imports: [VndCurrencyPipe],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-2xl font-semibold">Chi tiết lương</h3>
          <p class="mt-1 text-sm text-slate-500">
            Tổng quan Gross → Net, BHXH/BHYT/BHTN và thuế TNCN.
          </p>
        </div>
        <button class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white">
          Tạo phiếu lương
        </button>
      </div>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <article class="rounded-xl border border-slate-200 bg-white p-4">
          <p class="text-xs uppercase text-slate-500">Lương gross</p>
          <p class="mt-2 text-xl font-semibold">{{ payroll().grossSalary | vndCurrency }}</p>
        </article>
        <article class="rounded-xl border border-slate-200 bg-white p-4">
          <p class="text-xs uppercase text-slate-500">BHXH</p>
          <p class="mt-2 text-xl font-semibold">{{ payroll().insurance.bhxh | vndCurrency }}</p>
        </article>
        <article class="rounded-xl border border-slate-200 bg-white p-4">
          <p class="text-xs uppercase text-slate-500">BHYT</p>
          <p class="mt-2 text-xl font-semibold">{{ payroll().insurance.bhyt | vndCurrency }}</p>
        </article>
        <article class="rounded-xl border border-slate-200 bg-white p-4">
          <p class="text-xs uppercase text-slate-500">BHTN</p>
          <p class="mt-2 text-xl font-semibold">{{ payroll().insurance.bhtn | vndCurrency }}</p>
        </article>
        <article class="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p class="text-xs uppercase text-emerald-700">Lương net</p>
          <p class="mt-2 text-xl font-semibold text-emerald-700">{{ payroll().netSalary | vndCurrency }}</p>
        </article>
      </div>

      <section class="rounded-xl border border-slate-200 bg-white p-5">
        <h4 class="text-lg font-semibold">Xem trước lương (mô phỏng)</h4>
        <p class="mt-2 text-sm text-slate-600">
          Lương gross tháng:
          <span class="font-medium">{{ selectedGrossSalary() | vndCurrency }}</span>
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
          <span class="font-medium">{{ payroll().personalIncomeTax | vndCurrency }}</span>
        </div>
      </section>

      <section class="grid gap-4 lg:grid-cols-2">
        <article class="rounded-xl border border-slate-200 bg-white p-5">
          <h4 class="text-base font-semibold">Chi tiết bảo hiểm</h4>
          <div class="mt-4 space-y-2 text-sm">
            <div class="flex justify-between">
              <span>BHXH (8%)</span>
              <span class="font-medium">{{ payroll().insurance.bhxh | vndCurrency }}</span>
            </div>
            <div class="flex justify-between">
              <span>BHYT (1,5%)</span>
              <span class="font-medium">{{ payroll().insurance.bhyt | vndCurrency }}</span>
            </div>
            <div class="flex justify-between">
              <span>BHTN (1%)</span>
              <span class="font-medium">{{ payroll().insurance.bhtn | vndCurrency }}</span>
            </div>
            <div class="mt-3 flex justify-between border-t border-slate-200 pt-3 font-semibold">
              <span>Tổng bảo hiểm</span>
              <span>{{ payroll().insurance.total | vndCurrency }}</span>
            </div>
          </div>
        </article>

        <article class="rounded-xl border border-slate-200 bg-white p-5">
          <h4 class="text-base font-semibold">Tóm tắt chịu thuế</h4>
          <div class="mt-4 space-y-2 text-sm">
            <div class="flex justify-between">
              <span>Thu nhập chịu thuế</span>
              <span class="font-medium">{{ payroll().taxableIncome | vndCurrency }}</span>
            </div>
            <div class="flex justify-between">
              <span>Thuế thu nhập cá nhân</span>
              <span class="font-medium">{{ payroll().personalIncomeTax | vndCurrency }}</span>
            </div>
            <div class="mt-3 flex justify-between border-t border-slate-200 pt-3 text-base font-semibold text-emerald-700">
              <span>Thực nhận</span>
              <span>{{ payroll().netSalary | vndCurrency }}</span>
            </div>
          </div>
        </article>
      </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PayrollDetailComponent {
  private readonly payrollService = inject(PayrollService);
  readonly selectedGrossSalary = signal(35_000_000);
  readonly payroll = computed(() => this.payrollService.calculateNetSalary(this.selectedGrossSalary()));

  onGrossSalaryChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.selectedGrossSalary.set(Number(target.value));
  }
}
