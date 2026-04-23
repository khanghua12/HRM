import { AsyncPipe, CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../../../../environments/environment';

interface PayrollRow {
  id: string;
  employeeId: string;
  period: string;
  grossSalary: number;
  insuranceTotal: number;
  personalIncomeTax: number;
  netSalary: number;
  status: 'draft' | 'confirmed' | 'paid';
  createdAt: string;
}

@Component({
  selector: 'app-payroll-detail',
  standalone: true,
  imports: [AsyncPipe, CurrencyPipe, DatePipe],
  template: `
    <div class="space-y-6">
      <div class="rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 p-6 text-white shadow-sm">
        <h3 class="text-3xl font-semibold">Bảng lương</h3>
      </div>

      @if (vm$ | async; as vm) {
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p class="text-xs uppercase text-slate-500">Số bản ghi</p><p class="mt-3 text-2xl font-semibold text-slate-900">{{ vm.total }}</p></article>
          <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p class="text-xs uppercase text-slate-500">Tổng gross</p><p class="mt-3 text-2xl font-semibold text-slate-900">{{ vm.totalGross | currency:'VND':'symbol':'1.0-0' }}</p></article>
          <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p class="text-xs uppercase text-slate-500">Tổng thực nhận</p><p class="mt-3 text-2xl font-semibold text-slate-900">{{ vm.totalNet | currency:'VND':'symbol':'1.0-0' }}</p></article>
          <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p class="text-xs uppercase text-slate-500">Đã trả</p><p class="mt-3 text-2xl font-semibold text-slate-900">{{ vm.paid }}</p></article>
        </div>

        <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="overflow-x-auto rounded-xl border border-slate-200">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
              <thead class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr><th class="px-4 py-3">Period</th><th class="px-4 py-3">Employee</th><th class="px-4 py-3">Gross</th><th class="px-4 py-3">Insurance</th><th class="px-4 py-3">PIT</th><th class="px-4 py-3">Net</th><th class="px-4 py-3">Status</th></tr>
              </thead>
              <tbody class="divide-y divide-slate-100 bg-white">
                @for (r of vm.rows; track r.id) {
                  <tr class="hover:bg-slate-50">
                    <td class="px-4 py-3 text-slate-700">{{ r.period }}</td>
                    <td class="px-4 py-3 text-slate-700">{{ r.employeeId }}</td>
                    <td class="px-4 py-3 text-slate-700">{{ r.grossSalary | currency:'VND':'symbol':'1.0-0' }}</td>
                    <td class="px-4 py-3 text-slate-700">{{ r.insuranceTotal | currency:'VND':'symbol':'1.0-0' }}</td>
                    <td class="px-4 py-3 text-slate-700">{{ r.personalIncomeTax | currency:'VND':'symbol':'1.0-0' }}</td>
                    <td class="px-4 py-3 font-semibold text-red-600">{{ r.netSalary | currency:'VND':'symbol':'1.0-0' }}</td>
                    <td class="px-4 py-3 text-slate-700">{{ r.status }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PayrollDetailComponent {
  private readonly http = inject(HttpClient);

  readonly vm$ = this.http.get<PayrollRow[]>(`${environment.apiBaseUrl}/payroll/records`).pipe(
    map((rows) => ({
      rows,
      total: rows.length,
      paid: rows.filter((x) => x.status === 'paid').length,
      totalGross: rows.reduce((s, x) => s + Number(x.grossSalary || 0), 0),
      totalNet: rows.reduce((s, x) => s + Number(x.netSalary || 0), 0)
    }))
  );
}
