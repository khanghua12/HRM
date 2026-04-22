import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { KpiService } from '../../../../core/services/kpi.service';
import { KpiMetric, KpiEvaluation } from '../../../../models/performance.model';

type PerformanceStatus = 'Đạt' | 'Không đạt';

@Component({
  selector: 'app-performance-dashboard',
  standalone: true,
  template: `
    <div class="space-y-6">
      <div class="rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 p-6 text-white shadow-sm">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-3xl space-y-2">
            <p class="text-sm/6 uppercase tracking-[0.2em] text-indigo-100">Hiệu suất KPI</p>
            <h3 class="text-3xl font-semibold">Bảng quản trị KPI nhân sự</h3>
            <p class="text-sm text-indigo-50">
              Cho phép kế toán và quản lý điều chỉnh trọng số, chỉ số và kết quả đánh giá theo từng kỳ.
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button class="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/30 hover:bg-white/15" type="button" (click)="toggleConfig()">
              {{ showConfig() ? 'Đóng cấu hình' : 'Cấu hình KPI' }}
            </button>
            <button class="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm" type="button" (click)="seedEvaluation()">
              Tạo bản đánh giá mẫu
            </button>
          </div>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 class="text-sm font-semibold text-slate-500">Điểm KPI tổng</h4>
          <p class="mt-2 text-3xl font-bold text-indigo-600">{{ result().weightedScore }}/100</p>
          <p class="mt-1 text-sm text-slate-500">Tổng hợp từ lương và công việc</p>
        </section>
        <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 class="text-sm font-semibold text-slate-500">Trạng thái</h4>
          <p class="mt-2 text-3xl font-bold" [class.text-emerald-600]="status() === 'Đạt'" [class.text-rose-600]="status() === 'Không đạt'">{{ status() }}</p>
          <p class="mt-1 text-sm text-slate-500">Ngưỡng đạt: 75 điểm</p>
        </section>
        <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 class="text-sm font-semibold text-slate-500">Hiệu suất lương</h4>
          <p class="mt-2 text-3xl font-bold text-slate-900">{{ payrollScore() }}/100</p>
          <p class="mt-1 text-sm text-slate-500">Dựa trên thu nhập thực lĩnh</p>
        </section>
        <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 class="text-sm font-semibold text-slate-500">Hiệu suất công việc</h4>
          <p class="mt-2 text-3xl font-bold text-slate-900">{{ workScore() }}/100</p>
          <p class="mt-1 text-sm text-slate-500">Dựa trên tiến độ và trạng thái</p>
        </section>
      </div>

      @if (showConfig()) {
        <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h4 class="text-lg font-semibold text-slate-900">Cấu hình KPI</h4>
              <p class="text-sm text-slate-500">Sửa trực tiếp chỉ số, trọng số và ngưỡng đánh giá.</p>
            </div>
            <button class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" type="button" (click)="resetConfig()">
              Khôi phục mẫu
            </button>
          </div>

          <div class="mt-4 grid gap-4 xl:grid-cols-2">
            <article class="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h5 class="font-semibold text-slate-900">KPI lương</h5>
              <div class="mt-3 space-y-3">
                @for (metric of payrollMetrics(); track metric.id) {
                  <div class="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-[1.5fr_80px_80px] md:items-center">
                    <input class="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500" [value]="metric.name" (input)="updateMetric('payroll', metric.id, 'name', $any($event.target).value)" />
                    <input class="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500" type="number" min="0" max="100" [value]="metric.score" (input)="updateMetric('payroll', metric.id, 'score', $any($event.target).value)" />
                    <input class="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500" type="number" min="0" max="100" [value]="metric.weight" (input)="updateMetric('payroll', metric.id, 'weight', $any($event.target).value)" />
                  </div>
                }
              </div>
            </article>

            <article class="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h5 class="font-semibold text-slate-900">KPI công việc</h5>
              <div class="mt-3 space-y-3">
                @for (metric of workMetrics(); track metric.id) {
                  <div class="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-[1.5fr_80px_80px] md:items-center">
                    <input class="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" [value]="metric.name" (input)="updateMetric('work', metric.id, 'name', $any($event.target).value)" />
                    <input class="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" type="number" min="0" max="100" [value]="metric.score" (input)="updateMetric('work', metric.id, 'score', $any($event.target).value)" />
                    <input class="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" type="number" min="0" max="100" [value]="metric.weight" (input)="updateMetric('work', metric.id, 'weight', $any($event.target).value)" />
                  </div>
                }
              </div>
            </article>
          </div>

          <div class="mt-4 grid gap-3 md:grid-cols-3">
            <label class="space-y-1 text-sm text-slate-700">
              <span>Kỳ đánh giá</span>
              <input class="h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-indigo-500" [value]="evaluationPeriod()" (input)="evaluationPeriod.set($any($event.target).value)" />
            </label>
            <label class="space-y-1 text-sm text-slate-700">
              <span>Ngưỡng đạt</span>
              <input type="number" class="h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-indigo-500" [value]="passThreshold()" (input)="passThreshold.set(normalizeNumber($any($event.target).value, 0, 100))" />
            </label>
            <label class="space-y-1 text-sm text-slate-700">
              <span>Ghi chú chung</span>
              <input class="h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-indigo-500" [value]="generalNote()" (input)="generalNote.set($any($event.target).value)" />
            </label>
          </div>
        </section>
      }

      <section class="grid gap-4 xl:grid-cols-2">
        <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between gap-3">
            <h4 class="font-semibold">Chỉ số KPI lương</h4>
            <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{{ payrollScore() }}/100</span>
          </div>
          <div class="mt-4 space-y-4">
            @for (metric of payrollMetrics(); track metric.id) {
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
        </article>

        <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between gap-3">
            <h4 class="font-semibold">Chỉ số KPI công việc</h4>
            <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{{ workScore() }}/100</span>
          </div>
          <div class="mt-4 space-y-4">
            @for (metric of workMetrics(); track metric.id) {
              <div>
                <div class="mb-1 flex justify-between text-sm">
                  <span>{{ metric.name }} ({{ metric.weight }}%)</span>
                  <span class="font-medium">{{ metric.score }}</span>
                </div>
                <div class="h-2 rounded bg-slate-100">
                  <div class="h-2 rounded bg-sky-500" [style.width.%]="metric.score"></div>
                </div>
              </div>
            }
          </div>
        </article>
      </section>

      <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h4 class="text-lg font-semibold text-slate-900">Danh sách đánh giá KPI</h4>
            <p class="text-sm text-slate-500">Cho phép theo dõi, chỉnh sửa và chốt kết quả cho từng nhân viên.</p>
          </div>
          <div class="flex flex-wrap gap-2 text-sm">
            @for (f of statusFilters; track f.id) {
              <button class="rounded-lg border px-3 py-2 font-medium" type="button" [class.border-indigo-600]="activeStatusFilter() === f.id" [class.text-indigo-700]="activeStatusFilter() === f.id" [class.bg-indigo-50]="activeStatusFilter() === f.id" [class.border-slate-200]="activeStatusFilter() !== f.id" [class.text-slate-700]="activeStatusFilter() !== f.id" (click)="activeStatusFilter.set(f.id)">
                {{ f.label }}
              </button>
            }
          </div>
        </div>

        <div class="mt-4 overflow-x-auto rounded-xl border border-slate-200">
          <table class="min-w-[1100px] divide-y divide-slate-200 text-sm">
            <thead class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th class="px-4 py-3">Nhân viên</th>
                <th class="px-4 py-3">Kỳ</th>
                <th class="px-4 py-3">Điểm lương</th>
                <th class="px-4 py-3">Điểm công việc</th>
                <th class="px-4 py-3">Tổng điểm</th>
                <th class="px-4 py-3">Trạng thái</th>
                <th class="px-4 py-3">Ghi chú</th>
                <th class="px-4 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              @for (evaluation of filteredEvaluations(); track evaluation.employeeId + evaluation.period) {
                <tr class="hover:bg-slate-50">
                  <td class="px-4 py-3">
                    <div class="font-medium text-slate-900">{{ evaluation.employeeName }}</div>
                    <div class="text-xs text-slate-500">{{ evaluation.employeeId }}</div>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-slate-700">{{ evaluation.period }}</td>
                  <td class="px-4 py-3 whitespace-nowrap text-slate-700">{{ evaluation.payrollScore }}</td>
                  <td class="px-4 py-3 whitespace-nowrap text-slate-700">{{ evaluation.workScore }}</td>
                  <td class="px-4 py-3 whitespace-nowrap font-semibold text-slate-900">{{ evaluation.finalScore }}</td>
                  <td class="px-4 py-3 whitespace-nowrap">
                    <span class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold" [class.bg-emerald-50]="evaluation.status === 'Đạt'" [class.text-emerald-700]="evaluation.status === 'Đạt'" [class.bg-rose-50]="evaluation.status === 'Không đạt'" [class.text-rose-700]="evaluation.status === 'Không đạt'">
                      {{ evaluation.status }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-slate-600">{{ evaluation.note || '—' }}</td>
                  <td class="px-4 py-3 text-right">
                    <button class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50" type="button" (click)="loadEvaluation(evaluation)">
                      Sửa
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      @if (showEditor()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" (click)="closeEditor()">
          <div class="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl" (click)="$event.stopPropagation()">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h4 class="text-xl font-semibold text-slate-900">Chỉnh sửa đánh giá KPI</h4>
                <p class="text-sm text-slate-500">Cập nhật điểm và chốt kết quả như một admin portal.</p>
              </div>
              <button class="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600" type="button" (click)="closeEditor()">Đóng</button>
            </div>

            <div class="mt-4 grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div class="grid gap-3 md:grid-cols-2">
                <div>
                  <label class="text-xs font-medium text-slate-600">Nhân viên</label>
                  <input class="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" [value]="evaluationDraft().employeeName" (input)="updateDraft('employeeName', $any($event.target).value)" />
                </div>
                <div>
                  <label class="text-xs font-medium text-slate-600">Kỳ đánh giá</label>
                  <input class="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" [value]="evaluationDraft().period" (input)="updateDraft('period', $any($event.target).value)" />
                </div>
                <div>
                  <label class="text-xs font-medium text-slate-600">Điểm lương</label>
                  <input type="number" min="0" max="100" class="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" [value]="evaluationDraft().payrollScore" (input)="updateDraft('payrollScore', $any($event.target).value)" />
                </div>
                <div>
                  <label class="text-xs font-medium text-slate-600">Điểm công việc</label>
                  <input type="number" min="0" max="100" class="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" [value]="evaluationDraft().workScore" (input)="updateDraft('workScore', $any($event.target).value)" />
                </div>
                <div>
                  <label class="text-xs font-medium text-slate-600">Trạng thái</label>
                  <select class="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" [value]="evaluationDraft().status" (change)="updateDraft('status', $any($event.target).value)">
                    <option value="Đạt">Đạt</option>
                    <option value="Không đạt">Không đạt</option>
                  </select>
                </div>
                <div>
                  <label class="text-xs font-medium text-slate-600">Ngưỡng đạt</label>
                  <input type="number" min="0" max="100" class="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" [value]="passThreshold()" disabled />
                </div>
              </div>
              <div>
                <label class="text-xs font-medium text-slate-600">Ghi chú</label>
                <textarea class="mt-1 min-h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" [value]="evaluationDraft().note" (input)="updateDraft('note', $any($event.target).value)"></textarea>
              </div>

              <div class="flex justify-end gap-2">
                <button class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700" type="button" (click)="closeEditor()">Huỷ</button>
                <button class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white" type="button" (click)="saveEvaluation()">Lưu thay đổi</button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PerformanceDashboardComponent {
  private readonly kpiService = inject(KpiService);

  readonly showConfig = signal(false);
  readonly showEditor = signal(false);
  readonly passThreshold = signal(75);
  readonly evaluationPeriod = signal('Kỳ 04/2026');
  readonly generalNote = signal('KPI được cập nhật bởi admin portal');
  readonly activeStatusFilter = signal<'all' | PerformanceStatus>('all');

  readonly payrollMetrics = signal<KpiMetric[]>([
    { id: 'salary', name: 'Thu nhập thực lĩnh', score: 82, weight: 35 },
    { id: 'allowance', name: 'Phụ cấp & thưởng', score: 78, weight: 20 },
    { id: 'deduction', name: 'Tuân thủ khấu trừ', score: 90, weight: 15 }
  ]);

  readonly workMetrics = signal<KpiMetric[]>([
    { id: 'deadline', name: 'Hoàn thành đúng hạn', score: 88, weight: 40 },
    { id: 'progress', name: 'Tiến độ công việc', score: 84, weight: 35 },
    { id: 'status', name: 'Trạng thái công việc', score: 92, weight: 25 }
  ]);

  readonly evaluations = signal<KpiEvaluation[]>([
    this.kpiService.buildEvaluation('EMP-001', 'Nguyễn Minh Anh', 'Kỳ 04/2026', 82, 88, 'Đạt KPI tốt'),
    this.kpiService.buildEvaluation('EMP-002', 'Trần Quốc Huy', 'Kỳ 04/2026', 70, 72, 'Cần cải thiện tiến độ'),
    this.kpiService.buildEvaluation('EMP-003', 'Lê Thảo Vy', 'Kỳ 04/2026', 90, 91, 'Vượt mục tiêu'),
    this.kpiService.buildEvaluation('EMP-004', 'Phạm Gia Bảo', 'Kỳ 04/2026', 68, 74, 'Theo dõi thêm')
  ]);

  readonly evaluationDraft = signal<KpiEvaluation>({
    employeeId: '',
    employeeName: '',
    period: '',
    payrollScore: 0,
    workScore: 0,
    finalScore: 0,
    status: 'Không đạt',
    note: ''
  });

  readonly result = computed(() => this.kpiService.calculateCombinedScore(this.payrollMetrics(), this.workMetrics()));
  readonly status = computed<PerformanceStatus>(() => (this.result().weightedScore >= this.passThreshold() ? 'Đạt' : 'Không đạt'));
  readonly payrollScore = computed(() => this.kpiService.calculateWeightedScore(this.payrollMetrics()).weightedScore);
  readonly workScore = computed(() => this.kpiService.calculateWeightedScore(this.workMetrics()).weightedScore);

  readonly statusFilters = [
    { id: 'all' as const, label: 'Tất cả' },
    { id: 'Đạt' as const, label: 'Đạt' },
    { id: 'Không đạt' as const, label: 'Không đạt' }
  ];

  readonly filteredEvaluations = computed(() => {
    const filter = this.activeStatusFilter();
    return filter === 'all' ? this.evaluations() : this.evaluations().filter((item) => item.status === filter);
  });

  toggleConfig(): void {
    this.showConfig.set(!this.showConfig());
  }

  normalizeNumber(raw: string | number, min = 0, max = 100): number {
    const next = typeof raw === 'string' ? parseInt(raw, 10) : raw;
    if (!Number.isFinite(next)) return min;
    return Math.min(max, Math.max(min, Math.round(next)));
  }

  updateMetric(group: 'payroll' | 'work', metricId: string, key: 'name' | 'score' | 'weight', raw: string | number): void {
    const value = key === 'name' ? String(raw) : this.normalizeNumber(raw);
    const collection = group === 'payroll' ? this.payrollMetrics : this.workMetrics;
    collection.update((metrics) => metrics.map((metric) => (metric.id === metricId ? { ...metric, [key]: value } : metric)));
  }

  resetConfig(): void {
    this.passThreshold.set(75);
    this.evaluationPeriod.set('Kỳ 04/2026');
    this.generalNote.set('KPI được cập nhật bởi admin portal');
    this.payrollMetrics.set([
      { id: 'salary', name: 'Thu nhập thực lĩnh', score: 82, weight: 35 },
      { id: 'allowance', name: 'Phụ cấp & thưởng', score: 78, weight: 20 },
      { id: 'deduction', name: 'Tuân thủ khấu trừ', score: 90, weight: 15 }
    ]);
    this.workMetrics.set([
      { id: 'deadline', name: 'Hoàn thành đúng hạn', score: 88, weight: 40 },
      { id: 'progress', name: 'Tiến độ công việc', score: 84, weight: 35 },
      { id: 'status', name: 'Trạng thái công việc', score: 92, weight: 25 }
    ]);
  }

  seedEvaluation(): void {
    this.evaluations.update((items) => [
      this.kpiService.buildEvaluation('EMP-' + String(items.length + 1).padStart(3, '0'), `Nhân viên ${items.length + 1}`, this.evaluationPeriod(), this.payrollScore(), this.workScore(), this.generalNote()),
      ...items
    ]);
  }

  loadEvaluation(evaluation: KpiEvaluation): void {
    this.evaluationDraft.set({ ...evaluation });
    this.showEditor.set(true);
  }

  closeEditor(): void {
    this.showEditor.set(false);
  }

  updateDraft(field: keyof KpiEvaluation, raw: string | number): void {
    this.evaluationDraft.update((draft) => {
      if (field === 'payrollScore' || field === 'workScore') {
        const value = this.normalizeNumber(raw);
        const next: KpiEvaluation = { ...draft, [field]: value };
        const finalScore = Number((next.payrollScore * 0.45 + next.workScore * 0.55).toFixed(2));
        return {
          ...next,
          finalScore,
          status: finalScore >= this.passThreshold() ? 'Đạt' : 'Không đạt'
        };
      }

      if (field === 'status') {
        return {
          ...draft,
          status: raw === 'Đạt' ? 'Đạt' : 'Không đạt'
        };
      }

      return {
        ...draft,
        [field]: String(raw)
      } as KpiEvaluation;
    });
  }

  saveEvaluation(): void {
    const draft = this.evaluationDraft();
    const finalScore = Number((draft.payrollScore * 0.45 + draft.workScore * 0.55).toFixed(2));
    const next: KpiEvaluation = {
      ...draft,
      finalScore,
      status: finalScore >= this.passThreshold() ? 'Đạt' : 'Không đạt'
    };
    this.evaluations.update((items) => items.map((item) => (item.employeeId === next.employeeId && item.period === next.period ? next : item)));
    this.closeEditor();
  }
}
