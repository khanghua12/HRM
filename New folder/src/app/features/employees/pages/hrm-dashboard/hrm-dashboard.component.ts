import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import type { ChartConfiguration, ChartEvent } from 'chart.js';
import { LucideAngularModule } from 'lucide-angular';
import { EmployeesMockStore } from '../../services/employees-mock.store';

type WidgetAction = 'settings' | 'details' | 'print';

@Component({
  selector: 'app-hrm-dashboard',
  standalone: true,
  imports: [BaseChartDirective, LucideAngularModule],
  template: `
    <div class="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <article class="rounded-sm border border-slate-200 bg-white p-3 xl:col-span-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 class="text-sm font-semibold text-slate-900">Tổng quan theo phòng ban</h3>
            <p class="text-xs text-slate-500">Chọn phòng ban để xem số liệu tổng hợp.</p>
          </div>
          <select
            class="h-9 rounded border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-500"
            [value]="selectedDepartment()"
            (change)="onDepartmentChange($any($event.target).value)"
          >
            <option value="">Tất cả phòng ban</option>
            @for (department of departments(); track department) {
              <option [value]="department">{{ department }}</option>
            }
          </select>
        </div>
        <div class="mt-4 overflow-auto rounded border border-slate-200">
          <table class="min-w-full divide-y divide-slate-200 text-sm">
            <thead class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th class="px-3 py-2">Phòng ban</th>
                <th class="px-3 py-2">Tổng nhân sự</th>
                <th class="px-3 py-2">Chính thức</th>
                <th class="px-3 py-2">Thử việc</th>
                <th class="px-3 py-2">Thực tập</th>
                <th class="px-3 py-2">Khác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              @for (row of overviewRows(); track row.department) {
                <tr class="hover:bg-slate-50">
                  <td class="px-3 py-2 font-medium text-slate-900">{{ row.department }}</td>
                  <td class="px-3 py-2 text-slate-700">{{ row.total }}</td>
                  <td class="px-3 py-2 text-slate-700">{{ row.active }}</td>
                  <td class="px-3 py-2 text-slate-700">{{ row.probation }}</td>
                  <td class="px-3 py-2 text-slate-700">{{ row.intern }}</td>
                  <td class="px-3 py-2 text-slate-700">{{ row.other }}</td>
                </tr>
              }
              @if (overviewRows().length === 0) {
                <tr>
                  <td colspan="6" class="px-3 py-6 text-center text-sm text-slate-500">Không có dữ liệu.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </article>

      <!-- Row 1 -->
      <article class="rounded-sm border border-slate-200 bg-white p-3">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-semibold text-slate-900">Thống kê nhân sự theo trạng thái</h3>
            <p class="text-xs text-slate-500">Phân bổ tổng thể hiện tại.</p>
          </div>
          <div class="flex items-center gap-2 text-slate-500">
            <button class="rounded p-1 hover:bg-slate-100" type="button" (click)="onAction('settings')">
              <lucide-icon name="settings" class="h-4 w-4"></lucide-icon>
            </button>
          </div>
        </div>

        <div class="mt-2 grid grid-cols-2 gap-3">
          <div class="relative h-44">
            <canvas
              baseChart
              [type]="doughnutType"
              [data]="headcountByStatusData"
              [options]="doughnutOptions"
              (chartClick)="onStatusChartClick($event)"
            ></canvas>
            <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <div class="text-[10px] text-slate-500">Tổng</div>
              <div class="text-lg font-semibold text-slate-900">{{ total() }}</div>
            </div>
          </div>

          <div class="text-xs text-slate-600">
            <ul class="space-y-1">
              @for (it of headcountByStatusLegend; track it.key) {
                <li class="flex items-center justify-between gap-3">
                  <span class="flex items-center gap-2">
                    <span class="h-2.5 w-2.5 rounded-full" [style.background]="it.color"></span>
                    {{ it.label }}
                  </span>
                  <span class="tabular-nums text-slate-500">{{ it.value }}</span>
                </li>
              }
            </ul>
          </div>
        </div>
      </article>

      <article class="rounded-sm border border-slate-200 bg-white p-3">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-semibold text-slate-900">Thống kê nhân sự theo loại đối tượng</h3>
            <p class="text-xs text-slate-500">Phòng ban: A</p>
          </div>
          <button class="rounded p-1 text-slate-500 hover:bg-slate-100" type="button">
            <lucide-icon name="settings" class="h-4 w-4"></lucide-icon>
          </button>
        </div>
        <div class="mt-2 grid grid-cols-2 gap-3">
          <div class="relative h-44">
            <canvas baseChart [type]="doughnutType" [data]="objectTypeData" [options]="doughnutOptions"></canvas>
            <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <div class="text-[10px] text-slate-500">Tổng</div>
              <div class="text-lg font-semibold text-slate-900">{{ total() }}</div>
            </div>
          </div>
          <div class="text-xs text-slate-600">
            <ul class="space-y-1">
              @for (it of objectTypeLegend; track it.key) {
                <li class="flex items-center justify-between gap-3">
                  <span class="flex items-center gap-2">
                    <span class="h-2.5 w-2.5 rounded-full" [style.background]="it.color"></span>
                    {{ it.label }}
                  </span>
                  <span class="tabular-nums text-slate-500">{{ it.value }}</span>
                </li>
              }
            </ul>
          </div>
        </div>
      </article>

      <article class="rounded-sm border border-slate-200 bg-white p-3">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-semibold text-slate-900">Thống kê nhân sự theo trình độ chuyên môn</h3>
            <p class="text-xs text-slate-500">Phòng ban: A</p>
          </div>
          <div class="flex items-center gap-2 text-slate-500">
            <button class="rounded p-1 hover:bg-slate-100" type="button">
              <lucide-icon name="printer" class="h-4 w-4"></lucide-icon>
            </button>
            <button class="rounded p-1 hover:bg-slate-100" type="button">
              <lucide-icon name="settings" class="h-4 w-4"></lucide-icon>
            </button>
          </div>
        </div>
        <div class="mt-2 grid grid-cols-2 gap-3">
          <div class="relative h-44">
            <canvas baseChart [type]="doughnutType" [data]="educationData" [options]="doughnutOptions"></canvas>
            <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <div class="text-[10px] text-slate-500">Tổng</div>
              <div class="text-lg font-semibold text-slate-900">{{ total() }}</div>
            </div>
          </div>
          <div class="text-xs text-slate-600">
            <ul class="space-y-1">
              @for (it of educationLegend; track it.key) {
                <li class="flex items-center justify-between gap-3">
                  <span class="flex items-center gap-2">
                    <span class="h-2.5 w-2.5 rounded-full" [style.background]="it.color"></span>
                    {{ it.label }}
                  </span>
                  <span class="tabular-nums text-slate-500">{{ it.value }}</span>
                </li>
              }
            </ul>
          </div>
        </div>
      </article>

      <!-- Row 2 -->
      <article class="rounded-sm border border-slate-200 bg-white p-3 xl:col-span-1">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-semibold text-slate-900">Thống kê nhân sự theo chức danh</h3>
            <p class="text-xs text-slate-500">Phòng ban: A</p>
          </div>
          <button class="rounded p-1 text-slate-500 hover:bg-slate-100" type="button">
            <lucide-icon name="settings" class="h-4 w-4"></lucide-icon>
          </button>
        </div>
        <div class="mt-2 grid grid-cols-2 gap-3">
          <div class="relative h-44">
            <canvas baseChart [type]="pieType" [data]="titlePieData" [options]="pieOptions"></canvas>
            <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <div class="text-[10px] text-slate-500">Tổng</div>
              <div class="text-lg font-semibold text-slate-900">{{ total() }}</div>
            </div>
          </div>
          <div class="text-xs text-slate-600">
            <ul class="space-y-1">
              @for (it of titleLegend; track it.key) {
                <li class="flex items-center justify-between gap-3">
                  <span class="flex items-center gap-2">
                    <span class="h-2.5 w-2.5 rounded-full" [style.background]="it.color"></span>
                    {{ it.label }}
                  </span>
                  <span class="tabular-nums text-slate-500">{{ it.value }}</span>
                </li>
              }
            </ul>
          </div>
        </div>
      </article>

      <article class="rounded-sm border border-slate-200 bg-white p-3 xl:col-span-1">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-semibold text-slate-900">Thống kê nhân sự theo độ tuổi</h3>
            <p class="text-xs text-slate-500">Phòng ban: A</p>
          </div>
          <button class="rounded p-1 text-slate-500 hover:bg-slate-100" type="button">
            <lucide-icon name="settings" class="h-4 w-4"></lucide-icon>
          </button>
        </div>
        <div class="mt-2 grid grid-cols-2 gap-3">
          <div class="relative h-44">
            <canvas baseChart [type]="doughnutType" [data]="ageMultiDoughnutData" [options]="doughnutOptions"></canvas>
            <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <div class="text-[10px] text-slate-500">Tổng</div>
              <div class="text-lg font-semibold text-slate-900">{{ total() }}</div>
            </div>
          </div>
          <div class="text-xs text-slate-600">
            <ul class="space-y-1">
              @for (it of ageLegend; track it.key) {
                <li class="flex items-center justify-between gap-3">
                  <span class="flex items-center gap-2">
                    <span class="h-2.5 w-2.5 rounded-full" [style.background]="it.color"></span>
                    {{ it.label }}
                  </span>
                  <span class="tabular-nums text-slate-500">{{ it.value }}</span>
                </li>
              }
            </ul>
          </div>
        </div>
      </article>

      <article class="rounded-sm border border-slate-200 bg-white p-3 xl:col-span-1">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-semibold text-slate-900">Thống kê tăng giảm nhân sự</h3>
            <p class="text-xs text-slate-500">Phòng ban: A</p>
          </div>
          <div class="flex items-center gap-2 text-slate-500">
            <button class="rounded p-1 hover:bg-slate-100" type="button">
              <lucide-icon name="info" class="h-4 w-4"></lucide-icon>
            </button>
            <button class="rounded p-1 hover:bg-slate-100" type="button">
              <lucide-icon name="circle-ellipsis" class="h-4 w-4"></lucide-icon>
            </button>
          </div>
        </div>
        <div class="mt-2 h-44">
          <canvas baseChart [type]="lineType" [data]="lineData" [options]="lineOptions"></canvas>
        </div>
      </article>

      <!-- Row 3 -->
      <article class="rounded-sm border border-slate-200 bg-white p-3 xl:col-span-1">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-semibold text-slate-900">Thống kê giới tính</h3>
            <p class="text-xs text-slate-500">Phòng ban: A</p>
          </div>
          <button class="rounded p-1 text-slate-500 hover:bg-slate-100" type="button">
            <lucide-icon name="settings" class="h-4 w-4"></lucide-icon>
          </button>
        </div>
        <div class="mt-2 h-44">
          <canvas baseChart [type]="barType" [data]="genderBarData" [options]="barOptions"></canvas>
        </div>
      </article>

      <article class="rounded-sm border border-slate-200 bg-white p-3 xl:col-span-1">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-semibold text-slate-900">Danh sách nhân sự mới</h3>
            <p class="text-xs text-slate-500">Chưa có nhân sự mới trong tháng này</p>
          </div>
          <button class="rounded p-1 text-slate-500 hover:bg-slate-100" type="button">
            <lucide-icon name="settings" class="h-4 w-4"></lucide-icon>
          </button>
        </div>
        <div class="mt-2 h-44"></div>
      </article>

      <article class="rounded-sm border border-slate-200 bg-white p-3 xl:col-span-1">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-semibold text-slate-900">Danh sách nhân sự nghỉ việc</h3>
            <p class="text-xs text-slate-500">Chưa có nhân sự trong danh sách này</p>
          </div>
          <button class="rounded p-1 text-slate-500 hover:bg-slate-100" type="button">
            <lucide-icon name="settings" class="h-4 w-4"></lucide-icon>
          </button>
        </div>
        <div class="mt-2 h-44"></div>
      </article>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HrmDashboardComponent {
  private readonly router = inject(Router);
  private readonly store = inject(EmployeesMockStore);

  readonly selectedDepartment = signal('');
  readonly departments = computed(() => {
    const items = this.store.employees();
    return Array.from(new Set(items.map((e) => e.department))).sort((a, b) => a.localeCompare(b, 'vi'));
  });
  readonly overviewRows = computed(() => {
    const selected = this.selectedDepartment();
    const departments = selected ? [selected] : this.departments();
    const rows = departments.map((department) => {
      const items = this.store.employees().filter((e) => e.department === department);
      return {
        department,
        total: items.length,
        active: items.filter((e) => e.status === 'active').length,
        probation: items.filter((e) => e.status === 'probation').length,
        intern: items.filter((e) => e.status === 'intern').length,
        other: items.filter((e) => !['active', 'probation', 'intern'].includes(e.status)).length
      };
    });
    return rows.sort((a, b) => a.department.localeCompare(b.department, 'vi'));
  });

  readonly total = this.store.total;

  readonly doughnutType = 'doughnut' as const;
  readonly pieType = 'pie' as const;
  readonly lineType = 'line' as const;
  readonly barType = 'bar' as const;

  readonly doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true }
    }
  };

  readonly pieOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } }
  };

  readonly lineOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top', align: 'start' } },
    scales: {
      x: { grid: { color: 'rgba(148,163,184,0.25)' } },
      y: { grid: { color: 'rgba(148,163,184,0.25)' } }
    }
  };

  readonly barOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: 'rgba(148,163,184,0.25)' } }
    }
  };

  readonly headcountByStatusLegend = [
    { key: 'active', label: 'Chính thức', color: '#60a5fa', value: 22 },
    { key: 'trainee', label: 'Học việc', color: '#22c55e', value: 8 },
    { key: 'onboarding', label: 'Cộng tác viên', color: '#a78bfa', value: 6 },
    { key: 'probation', label: 'Thử việc', color: '#f59e0b', value: 4 },
    { key: 'intern', label: 'Thực tập', color: '#0ea5e9', value: 3 },
    { key: 'inactive', label: 'Viên chức', color: '#94a3b8', value: 1 }
  ] as const;

  readonly headcountByStatusData: ChartConfiguration<'doughnut'>['data'] = {
    labels: this.headcountByStatusLegend.map((x) => x.label),
    datasets: [
      {
        data: this.headcountByStatusLegend.map((x) => x.value),
        backgroundColor: this.headcountByStatusLegend.map((x) => x.color),
        borderWidth: 0
      }
    ]
  };

  readonly objectTypeLegend = [
    { key: 'Chuyên môn', label: 'Chuyên môn', color: '#60a5fa', value: 20 },
    { key: 'Công tác viên', label: 'Cộng tác viên', color: '#a78bfa', value: 8 },
    { key: 'Thực tập sinh', label: 'Thực tập sinh', color: '#0ea5e9', value: 6 },
    { key: 'Học viên', label: 'Học viên', color: '#22c55e', value: 6 },
    { key: 'Viên chức', label: 'Viên chức', color: '#94a3b8', value: 4 }
  ] as const;

  readonly objectTypeData: ChartConfiguration<'doughnut'>['data'] = {
    labels: this.objectTypeLegend.map((x) => x.label),
    datasets: [{ data: this.objectTypeLegend.map((x) => x.value), backgroundColor: this.objectTypeLegend.map((x) => x.color), borderWidth: 0 }]
  };

  readonly educationLegend = [
    { key: 'Đại học', label: 'Đại học', color: '#60a5fa', value: 24 },
    { key: 'Cao đẳng', label: 'Cao đẳng', color: '#22c55e', value: 10 },
    { key: 'Trung cấp', label: 'Trung cấp', color: '#f59e0b', value: 6 },
    { key: 'Sau đại học', label: 'Sau đại học', color: '#a78bfa', value: 3 },
    { key: 'Khác', label: 'Khác', color: '#94a3b8', value: 1 }
  ] as const;

  readonly educationData: ChartConfiguration<'doughnut'>['data'] = {
    labels: this.educationLegend.map((x) => x.label),
    datasets: [{ data: this.educationLegend.map((x) => x.value), backgroundColor: this.educationLegend.map((x) => x.color), borderWidth: 0 }]
  };

  readonly titleLegend = [
    { key: 'cv1', label: 'Chuyên viên kỹ thuật bậc 1', color: '#60a5fa', value: 6 },
    { key: 'cv2', label: 'Chuyên viên kỹ thuật bậc 2', color: '#22c55e', value: 2 },
    { key: 'khac', label: 'Khác', color: '#94a3b8', value: 1 },
    { key: 'qly', label: 'Nhà quản lý', color: '#a78bfa', value: 1 },
    { key: 'ktv', label: 'Kỹ thuật viên VT1', color: '#f59e0b', value: 1 },
    { key: 'tuv', label: 'Tư vấn viên', color: '#0ea5e9', value: 1 }
  ] as const;

  readonly titlePieData: ChartConfiguration<'pie'>['data'] = {
    labels: this.titleLegend.map((x) => x.label),
    datasets: [{ data: this.titleLegend.map((x) => x.value), backgroundColor: this.titleLegend.map((x) => x.color), borderWidth: 0 }]
  };

  readonly ageLegend = [
    { key: 'lt25', label: 'Nhỏ hơn 25', color: '#60a5fa', value: 3 },
    { key: '18_24', label: 'Từ 18 - 24', color: '#a78bfa', value: 8 },
    { key: '25_34', label: 'Từ 25 - 34', color: '#22c55e', value: 32 },
    { key: '35_44', label: 'Từ 35 - 44', color: '#f59e0b', value: 1 },
    { key: '45_54', label: 'Từ 45 - 54', color: '#0ea5e9', value: 0 },
    { key: '55_60', label: 'Từ 55 - 60', color: '#94a3b8', value: 0 },
    { key: 'gt60', label: 'Lớn hơn 60', color: '#64748b', value: 0 }
  ] as const;

  readonly ageMultiDoughnutData: ChartConfiguration<'doughnut'>['data'] = {
    labels: this.ageLegend.map((x) => x.label),
    datasets: [
      {
        data: this.ageLegend.map((x) => x.value),
        backgroundColor: this.ageLegend.map((x) => x.color),
        borderWidth: 0
      },
      {
        data: this.ageLegend.map((x) => (x.value ? 1 : 0)),
        backgroundColor: this.ageLegend.map((x) => withAlpha(x.color, 0.25)),
        borderWidth: 0
      }
    ]
  };

  readonly lineData: ChartConfiguration<'line'>['data'] = {
    labels: Array.from({ length: 20 }, (_, i) => String(i + 1)),
    datasets: [
      {
        label: 'Nghỉ việc',
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34,197,94,0.15)',
        tension: 0.35,
        pointRadius: 0
      },
      {
        label: 'Tiếp nhận',
        data: [0, 0, 10, 0, 12, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.15)',
        tension: 0.35,
        pointRadius: 0
      }
    ]
  };

  readonly genderBarData: ChartConfiguration<'bar'>['data'] = {
    labels: ['Nam', 'Nữ', 'Khác'],
    datasets: [
      {
        data: [1, 2, 0],
        backgroundColor: ['#3b82f6', '#ef4444', '#94a3b8'],
        borderWidth: 0,
        barThickness: 26
      }
    ]
  };

  onDepartmentChange(next: string): void {
    this.selectedDepartment.set(next.trim());
  }

  onStatusChartClick(evt: { event?: ChartEvent; active?: Array<unknown> }): void {
    const active = (evt.active ?? []) as Array<{ index?: number }>;
    const index = active[0]?.index;
    if (index == null) return;

    const key = this.headcountByStatusLegend[index]?.key;
    if (!key) return;

    void this.router.navigate(['/employees/ho-so'], { queryParams: { status: key } });
  }

  onAction(action: WidgetAction): void {
    void action;
  }
}

function withAlpha(hex: string, alpha: number): string {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

