import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { KpiService } from '../../../../core/services/kpi.service';
import { KpiMetric } from '../../../../models/performance.model';

@Component({
  selector: 'app-performance-dashboard',
  standalone: true,
  template: `
    <div class="space-y-6">
      <div class="flex items-start justify-between">
        <div>
          <h3 class="text-2xl font-semibold">Hiệu suất & KPI</h3>
          <p class="mt-1 text-sm text-slate-500">
            Trọng số KPI và khung đánh giá 360 (bản demo).
          </p>
        </div>
        <button class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white">
          Tạo kỳ KPI
        </button>
      </div>
      <div class="grid gap-4 md:grid-cols-3">
        <section class="rounded-xl border border-slate-200 bg-white p-5">
          <h4 class="font-semibold text-slate-600">Điểm KPI hiện tại</h4>
          <p class="mt-2 text-3xl font-bold text-indigo-600">{{ score().weightedScore }}/100</p>
        </section>
        <section class="rounded-xl border border-slate-200 bg-white p-5">
          <h4 class="font-semibold text-slate-600">Tiến độ đánh giá</h4>
          <p class="mt-2 text-3xl font-bold">76%</p>
        </section>
        <section class="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <h4 class="font-semibold text-emerald-700">Nhân viên xuất sắc</h4>
          <p class="mt-2 text-3xl font-bold text-emerald-700">12</p>
        </section>
      </div>

      <section class="rounded-xl border border-slate-200 bg-white p-5">
        <h4 class="mb-4 font-semibold">Chỉ số KPI</h4>
        <div class="space-y-4">
          @for (metric of metrics(); track metric.id) {
            <div>
              <div class="mb-1 flex justify-between text-sm">
                <span>{{ metric.name }} ({{ metric.weight }}%)</span>
                <span class="font-medium">{{ metric.score }}</span>
              </div>
              <div class="h-2 rounded bg-slate-100">
                <div class="h-2 rounded bg-indigo-500" [style.width.%]="metric.score"></div>
              </div>
            </div>
          }
        </div>
      </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PerformanceDashboardComponent {
  private readonly kpiService = inject(KpiService);
  readonly metrics = signal<KpiMetric[]>([
    { id: '1', name: 'Bàn giao đúng hạn', score: 85, weight: 40 },
    { id: '2', name: 'Chất lượng công việc', score: 90, weight: 35 },
    { id: '3', name: 'Làm việc nhóm', score: 80, weight: 25 }
  ]);

  readonly score = computed(() => this.kpiService.calculateWeightedScore(this.metrics()));
}
