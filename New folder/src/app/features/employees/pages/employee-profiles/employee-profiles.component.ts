import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest, map, switchMap } from 'rxjs';
import { StatusBadgePipe } from '../../../../shared/pipes/status-badge.pipe';
import { EmployeeStatusLabelPipe } from '../../../../shared/pipes/employee-status-label.pipe';
import type { EmployeeStatus } from '../../models/employee-summary.model';
import { EmployeesMockStore } from '../../services/employees-mock.store';

@Component({
  selector: 'app-employee-profiles',
  standalone: true,
  imports: [AsyncPipe, RouterLink, StatusBadgePipe, EmployeeStatusLabelPipe],
  template: `
    <section class="rounded-sm border border-slate-200 bg-white p-4">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h3 class="text-base font-semibold text-slate-900">Hồ sơ nhân viên</h3>
          <p class="mt-1 text-xs text-slate-500">Danh sách hồ sơ theo bộ lọc từ Dashboard.</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <select
            class="h-9 rounded border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-500"
            [value]="statusFilter()"
            (change)="onStatusChange($any($event.target).value)"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Chính thức</option>
            <option value="onboarding">Onboard</option>
            <option value="probation">Thử việc</option>
            <option value="intern">Thực tập</option>
            <option value="trainee">Học việc</option>
            <option value="inactive">Nghỉ việc</option>
          </select>

          <select
            class="h-9 rounded border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-500"
            [value]="departmentFilter()"
            (change)="onDepartmentChange($any($event.target).value)"
          >
            <option value="">Tất cả phòng ban</option>
            @for (department of departments(); track department) {
              <option [value]="department">{{ department }}</option>
            }
          </select>
        </div>
      </div>

      <div class="mt-4 overflow-auto">
        <table class="min-w-full divide-y divide-slate-200 text-sm">
          <thead class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th class="px-3 py-2">Mã</th>
              <th class="px-3 py-2">Họ tên</th>
              <th class="px-3 py-2">Chức danh</th>
              <th class="px-3 py-2">Phòng ban</th>
              <th class="px-3 py-2">Trạng thái</th>
              <th class="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            @if (pageRows$ | async; as rows) {
              @for (e of rows; track e.id) {
                <tr class="bg-white hover:bg-slate-50">
                  <td class="px-3 py-2 font-medium text-slate-900">{{ e.code }}</td>
                  <td class="px-3 py-2 text-slate-800">{{ e.fullName }}</td>
                  <td class="px-3 py-2 text-slate-700">{{ e.title }}</td>
                  <td class="px-3 py-2 text-slate-700">{{ e.department }}</td>
                  <td class="px-3 py-2">
                    <span class="rounded-full px-2.5 py-1 text-xs font-medium" [class]="e.status | statusBadge">
                      {{ e.status | employeeStatusLabel }}
                    </span>
                  </td>
                  <td class="px-3 py-2 text-right">
                    <a
                      class="rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
                      [routerLink]="['/employees/ho-so', e.id]"
                    >
                      Xem
                    </a>
                  </td>
                </tr>
              }
              @if (rows.length === 0) {
                <tr>
                  <td colspan="6" class="px-3 py-6 text-center text-sm text-slate-500">Không có dữ liệu.</td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

      <div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3 text-sm">
        <div class="flex items-center gap-2 text-slate-600">
          <span class="text-xs text-slate-500">Dòng/trang</span>
          <select
            class="h-9 rounded border border-slate-200 bg-white px-2 text-sm outline-none focus:border-indigo-500"
            [value]="pageSize()"
            (change)="onPageSizeChange($any($event.target).value)"
          >
            <option [value]="10">10</option>
            <option [value]="20">20</option>
            <option [value]="50">50</option>
          </select>
          <span class="text-xs text-slate-500">
            Hiển thị {{ pageFrom() }}-{{ pageTo() }} / {{ totalRows() }}
          </span>
        </div>

        <div class="flex items-center gap-1">
          <button
            type="button"
            class="h-9 rounded border border-slate-200 bg-white px-3 text-sm hover:bg-slate-50 disabled:opacity-50"
            [disabled]="page() <= 1"
            (click)="goToPage(page() - 1)"
          >
            Trước
          </button>

          <div class="hidden items-center gap-1 md:flex">
            @for (p of pages(); track p) {
              <button
                type="button"
                class="h-9 rounded px-3 text-sm"
                [class]="p === page() ? 'bg-indigo-600 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'"
                (click)="goToPage(p)"
              >
                {{ p }}
              </button>
            }
          </div>

          <div class="md:hidden text-xs text-slate-500 px-2">
            Trang {{ page() }}/{{ totalPages() }}
          </div>

          <button
            type="button"
            class="h-9 rounded border border-slate-200 bg-white px-3 text-sm hover:bg-slate-50 disabled:opacity-50"
            [disabled]="page() >= totalPages()"
            (click)="goToPage(page() + 1)"
          >
            Sau
          </button>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeeProfilesComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(EmployeesMockStore);

  readonly statusFilter = signal<EmployeeStatus | ''>('');
  readonly departmentFilter = signal('');
  readonly page = signal(1);
  readonly pageSize = signal(10);

  readonly departments = computed(() => {
    const items = this.store.employees();
    return Array.from(new Set(items.map((e) => e.department))).sort((a, b) => a.localeCompare(b, 'vi'));
  });

  readonly allRows$ = this.route.queryParamMap.pipe(
    map((q) => ({
      status: (q.get('status') as EmployeeStatus | null) ?? '',
      department: q.get('department') ?? ''
    })),
    map(({ status, department }) => {
      const normalizedStatus = status as EmployeeStatus | '';
      this.statusFilter.set(normalizedStatus);
      this.departmentFilter.set(department);
      this.page.set(1);
      return { status: normalizedStatus, department };
    }),
    switchMap(({ status, department }) => this.store.list({ status: status || undefined, department: department || undefined }))
  );

  readonly totalRows$ = this.allRows$.pipe(map((rows) => rows.length));
  readonly totalRows = signal(0);

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalRows() / this.pageSize())));
  readonly pages = computed(() => {
    const total = this.totalPages();
    const current = this.page();
    const windowSize = 5;
    const start = Math.max(1, current - Math.floor(windowSize / 2));
    const end = Math.min(total, start + windowSize - 1);
    const start2 = Math.max(1, end - windowSize + 1);
    return Array.from({ length: end - start2 + 1 }, (_, i) => start2 + i);
  });

  readonly pageFrom = computed(() => (this.totalRows() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1));
  readonly pageTo = computed(() => Math.min(this.totalRows(), this.page() * this.pageSize()));

  readonly pageRows$ = combineLatest([this.allRows$, toObservable(this.page), toObservable(this.pageSize)]).pipe(
    map(([rows]) => {
      const size = this.pageSize();
      const p = clamp(this.page(), 1, Math.max(1, Math.ceil(rows.length / size)));
      if (p !== this.page()) this.page.set(p);
      const start = (p - 1) * size;
      return rows.slice(start, start + size);
    })
  );

  constructor() {
    this.totalRows$.subscribe((n) => this.totalRows.set(n));
  }

  onStatusChange(next: string): void {
    const status = (next as EmployeeStatus | '') ?? '';
    this.statusFilter.set(status);
    this.page.set(1);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { status: status || null },
      queryParamsHandling: 'merge'
    });
  }

  onDepartmentChange(next: string): void {
    const department = next.trim();
    this.departmentFilter.set(department);
    this.page.set(1);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { department: department || null },
      queryParamsHandling: 'merge'
    });
  }

  goToPage(p: number): void {
    this.page.set(clamp(p, 1, this.totalPages()));
  }

  onPageSizeChange(raw: string | number): void {
    const next = typeof raw === 'string' ? parseInt(raw, 10) : raw;
    const size = Number.isFinite(next) && next > 0 ? next : 10;
    this.pageSize.set(size);
    this.page.set(1);
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

