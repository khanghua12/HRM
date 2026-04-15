import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { ActivatedRoute, Router } from '@angular/router';
import { PayrollService } from '../../../../core/services/payroll.service';
import { VndCurrencyPipe } from '../../../../shared/pipes/vnd-currency.pipe';
import { PAYROLL_EMPLOYEE_RECORDS } from '../../data/payroll.mock';
import { calculationResultToPayroll } from '../../utils/payroll-mapper';

@Component({
  selector: 'app-payroll-detail',
  standalone: true,
  imports: [CommonModule, VndCurrencyPipe, BaseChartDirective],
  template: `
    <div class="space-y-6">
      <section
        class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            (click)="goBackToList()"
          >
            <span aria-hidden="true">←</span>
            Quay lại
          </button>
          <span class="rounded-lg bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
            Chi tiết phiếu lương
          </span>
        </div>

        <div class="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex items-center gap-4">
            <img
              [src]="record().employee.avatar || defaultAvatar"
              [alt]="record().employee.name"
              class="h-16 w-16 rounded-xl border border-slate-200 object-cover shadow-sm"
            />
            <div>
              <p class="text-xs font-medium uppercase tracking-wide text-indigo-600">Thông tin nhân viên</p>
              <h4 class="mt-1 text-xl font-semibold text-slate-900">{{ record().employee.name }}</h4>
              <p class="mt-1 text-sm text-slate-500">Mã nhân viên: {{ record().employee.code }}</p>
              <p class="mt-0.5 text-sm text-slate-500">Email: {{ record().employee.email }}</p>
            </div>
          </div>

          <label class="block text-sm font-medium text-slate-700">
            Tổng lương (gross) tháng này
            <p class="mt-2 rounded-lg bg-indigo-50 px-3 py-2 text-right text-lg font-semibold text-indigo-700">
              {{ selectedGrossSalary() | vndCurrency }}
            </p>
          </label>
        </div>

        <div class="mt-4 grid gap-3 md:grid-cols-2">
          <article class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p class="text-xs uppercase text-slate-500">Phòng ban</p>
            <p class="mt-1 font-semibold text-slate-800">{{ record().employee.department }}</p>
          </article>
          <article class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p class="text-xs uppercase text-slate-500">Chức vụ</p>
            <p class="mt-1 font-semibold text-slate-800">{{ record().employee.position }}</p>
          </article>
        </div>
      </section>

      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-2xl font-semibold">Chi tiết lương</h3>
          <p class="mt-1 text-sm text-slate-500">
            Gross, các khoản trừ BHXH/BHYT/BHTN, thuế TNCN và lương thực nhận.
          </p>
        </div>
        <button type="button" class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">
          Tạo phiếu lương
        </button>
      </div>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p class="text-xs uppercase text-slate-500">Tổng lương (gross)</p>
          <p class="mt-2 text-xl font-semibold">{{ payrollCalc().grossSalary | vndCurrency }}</p>
        </article>
        <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p class="text-xs uppercase text-slate-500">BHXH</p>
          <p class="mt-2 text-xl font-semibold">{{ payrollCalc().insurance.bhxh | vndCurrency }}</p>
        </article>
        <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p class="text-xs uppercase text-slate-500">BHYT</p>
          <p class="mt-2 text-xl font-semibold">{{ payrollCalc().insurance.bhyt | vndCurrency }}</p>
        </article>
        <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p class="text-xs uppercase text-slate-500">BHTN</p>
          <p class="mt-2 text-xl font-semibold">{{ payrollCalc().insurance.bhtn | vndCurrency }}</p>
        </article>
        <article class="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <p class="text-xs uppercase text-emerald-700">Lương thực nhận (net)</p>
          <p class="mt-2 text-xl font-semibold text-emerald-700">{{ payrollCalc().netSalary | vndCurrency }}</p>
        </article>
      </div>

      <section class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div class="border-b border-slate-100 px-5 py-4">
          <h4 class="text-lg font-semibold">Bảng lương chi tiết</h4>
          <p class="mt-1 text-sm text-slate-500">Hạng mục và số tiền theo kỳ lương hiện tại.</p>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 text-sm">
            <thead class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th class="px-5 py-3">Hạng mục</th>
                <th class="px-5 py-3 text-right">Số tiền</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr class="hover:bg-slate-50/80">
                <td class="px-5 py-3 font-medium text-slate-800">Lương gross</td>
                <td class="px-5 py-3 text-right tabular-nums font-semibold text-slate-900">
                  {{ payrollView().grossSalary | vndCurrency }}
                </td>
              </tr>
              <tr class="hover:bg-slate-50/80">
                <td class="px-5 py-3 text-slate-700">BHXH</td>
                <td class="px-5 py-3 text-right tabular-nums text-slate-800">
                  {{ payrollView().insurance.bhxh | vndCurrency }}
                </td>
              </tr>
              <tr class="hover:bg-slate-50/80">
                <td class="px-5 py-3 text-slate-700">BHYT</td>
                <td class="px-5 py-3 text-right tabular-nums text-slate-800">
                  {{ payrollView().insurance.bhyt | vndCurrency }}
                </td>
              </tr>
              <tr class="hover:bg-slate-50/80">
                <td class="px-5 py-3 text-slate-700">BHTN</td>
                <td class="px-5 py-3 text-right tabular-nums text-slate-800">
                  {{ payrollView().insurance.bhtn | vndCurrency }}
                </td>
              </tr>
              <tr class="hover:bg-slate-50/80">
                <td class="px-5 py-3 text-slate-700">Thuế TNCN</td>
                <td class="px-5 py-3 text-right tabular-nums text-slate-800">{{ payrollView().tax | vndCurrency }}</td>
              </tr>
              <tr class="bg-emerald-50/80 font-semibold hover:bg-emerald-50">
                <td class="px-5 py-3 text-emerald-900">Lương net</td>
                <td class="px-5 py-3 text-right tabular-nums text-emerald-800">{{ payrollView().netSalary | vndCurrency }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h4 class="text-lg font-semibold">Điều chỉnh gross (mô phỏng)</h4>
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
          <span class="font-medium">{{ payrollCalc().personalIncomeTax | vndCurrency }}</span>
        </div>
      </section>

      <section class="grid gap-4 lg:grid-cols-2">
        <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 class="text-base font-semibold">So sánh Gross và Net</h4>
          <p class="mt-1 text-sm text-slate-500">Biểu đồ cập nhật theo mức gross hiện tại.</p>
          <div class="mt-4 h-72">
            <canvas baseChart [type]="barChartType" [data]="salaryBarChartData()" [options]="barChartOptions"></canvas>
          </div>
        </article>

        <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 class="text-base font-semibold">Chi tiết bảo hiểm</h4>
          <div class="mt-4 space-y-2 text-sm">
            <div class="flex justify-between">
              <span>BHXH (8%)</span>
              <span class="font-medium">{{ payrollCalc().insurance.bhxh | vndCurrency }}</span>
            </div>
            <div class="flex justify-between">
              <span>BHYT (1,5%)</span>
              <span class="font-medium">{{ payrollCalc().insurance.bhyt | vndCurrency }}</span>
            </div>
            <div class="flex justify-between">
              <span>BHTN (1%)</span>
              <span class="font-medium">{{ payrollCalc().insurance.bhtn | vndCurrency }}</span>
            </div>
            <div class="mt-3 flex justify-between border-t border-slate-200 pt-3 font-semibold">
              <span>Tổng bảo hiểm</span>
              <span>{{ payrollCalc().insurance.total | vndCurrency }}</span>
            </div>
          </div>
        </article>

        <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h4 class="text-base font-semibold">Tóm tắt chịu thuế</h4>
          <div class="mt-4 space-y-2 text-sm">
            <div class="flex justify-between">
              <span>Thu nhập chịu thuế</span>
              <span class="font-medium">{{ payrollCalc().taxableIncome | vndCurrency }}</span>
            </div>
            <div class="flex justify-between">
              <span>Thuế thu nhập cá nhân</span>
              <span class="font-medium">{{ payrollCalc().personalIncomeTax | vndCurrency }}</span>
            </div>
            <div class="mt-3 flex justify-between border-t border-slate-200 pt-3 text-base font-semibold text-emerald-700">
              <span>Thực nhận</span>
              <span>{{ payrollCalc().netSalary | vndCurrency }}</span>
            </div>
          </div>
        </article>
      </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PayrollDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly payrollService = inject(PayrollService);

  readonly defaultAvatar = 'https://i.pravatar.cc/160?img=12';
  readonly records = signal(PAYROLL_EMPLOYEE_RECORDS);
  readonly employeeId = signal<number>(this.records()[0].employee.id);
  readonly record = computed(
    () => this.records().find((item) => item.employee.id === this.employeeId()) ?? this.records()[0]
  );

  readonly barChartType = 'bar' as const;
  readonly barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: 'rgba(148,163,184,0.25)' } }
    }
  };

  readonly selectedGrossSalary = signal(this.record().grossSalary);
  readonly payrollCalc = computed(() => this.payrollService.calculateNetSalary(this.selectedGrossSalary()));
  readonly payrollView = computed(() => calculationResultToPayroll(this.payrollCalc()));

  readonly salaryBarChartData = computed<ChartConfiguration<'bar'>['data']>(() => ({
    labels: ['Gross', 'Net'],
    datasets: [
      {
        data: [this.payrollCalc().grossSalary, this.payrollCalc().netSalary],
        backgroundColor: ['#6366f1', '#10b981'],
        borderRadius: 6,
        borderSkipped: false,
        barThickness: 40
      }
    ]
  }));

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      if (Number.isFinite(id) && this.records().some((item) => item.employee.id === id)) {
        this.employeeId.set(id);
        const gross = this.records().find((r) => r.employee.id === id)?.grossSalary ?? this.records()[0].grossSalary;
        this.selectedGrossSalary.set(gross);
        return;
      }

      this.employeeId.set(this.records()[0].employee.id);
      this.selectedGrossSalary.set(this.records()[0].grossSalary);
    });
  }

  goBackToList(): void {
    void this.router.navigate(['/payroll']);
  }

  onGrossSalaryChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.selectedGrossSalary.set(Number(target.value));
  }
}
