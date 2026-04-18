import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import type { ChartConfiguration } from 'chart.js';
import { map } from 'rxjs';
import { RecruitmentDigitalStore } from '../../services/recruitment-digital.store';

@Component({
  selector: 'app-recruitment-dashboard',
  standalone: true,
  imports: [AsyncPipe, BaseChartDirective],
  template: `
    <section class="space-y-4">
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        @if (kpis$ | async; as k) {
          <article class="rounded-xl border border-slate-200 bg-white p-4">
            <p class="text-xs uppercase text-slate-500">Tổng hồ sơ</p>
            <p class="mt-2 text-2xl font-semibold text-slate-900">{{ k.totalCandidates }}</p>
          </article>
          <article class="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p class="text-xs uppercase text-blue-700">Từ Google Form/Sheet</p>
            <p class="mt-2 text-2xl font-semibold text-blue-700">{{ k.fromGoogleForm }}</p>
          </article>
          <article class="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p class="text-xs uppercase text-emerald-700">Vị trí đang mở</p>
            <p class="mt-2 text-2xl font-semibold text-emerald-700">{{ k.openJobs }}</p>
          </article>
          <article class="rounded-xl border border-violet-200 bg-violet-50 p-4">
            <p class="text-xs uppercase text-violet-700">Bài Facebook chờ đăng</p>
            <p class="mt-2 text-2xl font-semibold text-violet-700">{{ k.queuedPosts }}</p>
          </article>
        }
      </div>

      <div class="grid gap-4 xl:grid-cols-3">
        <article class="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-1">
          <h4 class="text-sm font-semibold text-slate-900">Pipeline hồ sơ</h4>
          <div class="mt-3 h-72">
            @if (stageData$ | async; as stageData) {
              <canvas baseChart [type]="'doughnut'" [data]="stageData" [options]="doughnutOptions"></canvas>
            }
          </div>
        </article>
        <article class="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-1">
          <h4 class="text-sm font-semibold text-slate-900">Nguồn hồ sơ</h4>
          <div class="mt-3 h-72">
            @if (sourceData$ | async; as sourceData) {
              <canvas baseChart [type]="'bar'" [data]="sourceData" [options]="barOptions"></canvas>
            }
          </div>
        </article>
        <article class="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-1">
          <h4 class="text-sm font-semibold text-slate-900">Hồ sơ theo tháng</h4>
          <div class="mt-3 h-72">
            @if (monthlyData$ | async; as monthlyData) {
              <canvas baseChart [type]="'line'" [data]="monthlyData" [options]="lineOptions"></canvas>
            }
          </div>
        </article>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecruitmentDashboardComponent {
  private readonly store = inject(RecruitmentDigitalStore);

  readonly kpis$ = this.store.dashboardKpis$();

  readonly stageData$ = this.store.stageStats$.pipe(
    map((rows) => ({
      labels: rows.map((r) => stageLabel(r.stage)),
      datasets: [
        {
          data: rows.map((r) => r.count),
          backgroundColor: ['#38bdf8', '#818cf8', '#f59e0b', '#f97316', '#22c55e', '#f43f5e'],
          borderWidth: 0
        }
      ]
    }))
  );

  readonly sourceData$ = this.store.sourceStats$.pipe(
    map((rows) => ({
      labels: rows.map((r) => sourceLabel(r.source)),
      datasets: [{ label: 'Số hồ sơ', data: rows.map((r) => r.count), backgroundColor: '#6366f1' }]
    }))
  );

  readonly monthlyData$ = this.store.monthlyApplicantStats$.pipe(
    map((rows) => ({
      labels: rows.map((r) => r.month),
      datasets: [
        {
          label: 'Hồ sơ',
          data: rows.map((r) => r.count),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.2)',
          tension: 0.35,
          fill: true
        }
      ]
    }))
  );

  readonly doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } }
  };
  readonly barOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } }
  };
  readonly lineOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false
  };
}

function stageLabel(v: string): string {
  const m: Record<string, string> = {
    sourcing: 'Nguồn',
    screening: 'Sơ loại',
    interview: 'Phỏng vấn',
    offer: 'Offer',
    hired: 'Nhận việc',
    rejected: 'Loại'
  };
  return m[v] ?? v;
}
function sourceLabel(v: string): string {
  const m: Record<string, string> = {
    'google-form': 'Google Form',
    linkedin: 'LinkedIn',
    facebook: 'Facebook',
    referral: 'Giới thiệu',
    other: 'Khác'
  };
  return m[v] ?? v;
}

