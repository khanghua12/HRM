import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { combineLatest, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';

interface PayrollRow {
  employeeId: string;
  grossSalary: number;
  insuranceTotal: number;
  personalIncomeTax: number;
  netSalary: number;
}

interface WorkTask {
  assigneeId: string | null;
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface PerformanceReview {
  id: string;
  employeeId: string;
  cycle: string;
  score: number;
  rankLabel: string | null;
  reviewer: string | null;
  note: string | null;
  createdAt: string;
}

@Component({
  selector: 'app-performance-dashboard',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    <div class="space-y-6">
      <div class="rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 p-6 text-white shadow-sm">
        <h3 class="text-3xl font-semibold">Hiệu suất & KPI</h3>
        <p class="mt-2 text-sm text-indigo-100">Dữ liệu đang lấy thực tế từ DB (Payroll + Work + Performance review).</p>
      </div>

      @if (vm$ | async; as vm) {
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h4 class="text-sm font-semibold text-slate-500">KPI tổng</h4>
            <p class="mt-2 text-3xl font-bold text-indigo-600">{{ vm.kpiTotal }}</p>
          </article>
          <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h4 class="text-sm font-semibold text-slate-500">KPI từ lương</h4>
            <p class="mt-2 text-3xl font-bold text-slate-900">{{ vm.kpiPayroll }}</p>
          </article>
          <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h4 class="text-sm font-semibold text-slate-500">KPI từ công việc</h4>
            <p class="mt-2 text-3xl font-bold text-slate-900">{{ vm.kpiWork }}</p>
          </article>
          <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h4 class="text-sm font-semibold text-slate-500">KPI đánh giá kỳ</h4>
            <p class="mt-2 text-3xl font-bold text-slate-900">{{ vm.kpiReview }}</p>
          </article>
        </div>

        <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 class="text-lg font-semibold text-slate-900">Danh sách đánh giá KPI từ DB</h4>
          <div class="mt-4 overflow-x-auto rounded-xl border border-slate-200">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
              <thead class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th class="px-4 py-3">Cycle</th>
                  <th class="px-4 py-3">Employee</th>
                  <th class="px-4 py-3">Score</th>
                  <th class="px-4 py-3">Rank</th>
                  <th class="px-4 py-3">Reviewer</th>
                  <th class="px-4 py-3">Note</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 bg-white">
                @for (r of vm.reviews; track r.id) {
                  <tr class="hover:bg-slate-50">
                    <td class="px-4 py-3">{{ r.cycle }}</td>
                    <td class="px-4 py-3">{{ r.employeeId }}</td>
                    <td class="px-4 py-3 font-semibold">{{ r.score }}</td>
                    <td class="px-4 py-3">{{ r.rankLabel || '—' }}</td>
                    <td class="px-4 py-3">{{ r.reviewer || '—' }}</td>
                    <td class="px-4 py-3">{{ r.note || '—' }}</td>
                  </tr>
                }
                @if (vm.reviews.length === 0) {
                  <tr><td class="px-4 py-8 text-center text-slate-500" colspan="6">Chưa có dữ liệu đánh giá KPI.</td></tr>
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
export class PerformanceDashboardComponent {
  private readonly http = inject(HttpClient);

  readonly vm$ = combineLatest([
    this.http.get<PayrollRow[]>(`${environment.apiBaseUrl}/payroll/records`),
    this.http.get<WorkTask[]>(`${environment.apiBaseUrl}/work/tasks`),
    this.http.get<PerformanceReview[]>(`${environment.apiBaseUrl}/performance/reviews`)
  ]).pipe(
    map(([payrollRows, tasks, reviews]) => {
      const payrollNet = payrollRows.map((x) => Number(x.netSalary || 0));
      const maxNet = payrollNet.length ? Math.max(...payrollNet, 1) : 1;
      const avgNet = payrollNet.length ? payrollNet.reduce((s, x) => s + x, 0) / payrollNet.length : 0;
      const kpiPayroll = Math.round(Math.min(100, (avgNet / maxNet) * 100));

      const workPoints = tasks.map((t) => {
        const statusPoint = t.status === 'done' ? 100 : t.status === 'review' ? 80 : t.status === 'in_progress' ? 60 : t.status === 'todo' ? 30 : 0;
        const priorityWeight = t.priority === 'urgent' ? 1.2 : t.priority === 'high' ? 1.1 : 1;
        return Math.min(100, statusPoint * priorityWeight);
      });
      const kpiWork = workPoints.length ? Math.round(workPoints.reduce((s, x) => s + x, 0) / workPoints.length) : 0;

      const kpiReview = reviews.length ? Math.round(reviews.reduce((s, x) => s + Number(x.score || 0), 0) / reviews.length) : 0;

      const kpiTotal = Math.round(kpiPayroll * 0.35 + kpiWork * 0.35 + kpiReview * 0.3);

      return { kpiPayroll, kpiWork, kpiReview, kpiTotal, reviews };
    })
  );
}
