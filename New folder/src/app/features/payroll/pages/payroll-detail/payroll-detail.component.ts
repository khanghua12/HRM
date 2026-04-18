import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

interface PayrollEmployee {
  id: string;
  name: string;
  department: string;
  position: string;
  grossSalary: number;
  allowance: number;
  netSalary: number;
  raiseCount: number;
  yearsWorked: number;
  lastRaiseAt: string;
}

interface SalaryRaiseEvent {
  date: string;
  employee: string;
  reason: string;
  from: number;
  to: number;
}

@Component({
  selector: 'app-payroll-detail',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <div class="rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 p-6 text-white shadow-sm">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-2xl space-y-2">
            <p class="text-sm/6 uppercase tracking-[0.2em] text-indigo-100">Lương & phúc lợi</p>
            <h3 class="text-3xl font-semibold">Bảng tổng quan tiền lương</h3>
            <p class="text-sm text-indigo-50">
              Danh sách nhân viên, xem chi tiết, chỉnh sửa lương và xuất báo cáo cho toàn bộ dữ liệu.
            </p>
          </div>
          <button
            class="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm"
            type="button"
            (click)="exportExcel()"
          >
            Xuất báo cáo Excel
          </button>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        @for (item of summaryCards(); track item.label) {
          <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p class="text-xs uppercase tracking-wide text-slate-500">{{ item.label }}</p>
            <p class="mt-3 text-2xl font-semibold text-slate-900">{{ item.value }}</p>
            <p class="mt-1 text-sm text-slate-500">{{ item.note }}</p>
          </article>
        }
      </div>

      <section class="grid gap-4 xl:grid-cols-3">
        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h4 class="text-lg font-semibold text-slate-900">Biểu đồ tổng quan quỹ lương</h4>
              <p class="text-sm text-slate-500">So sánh gross theo từng phòng ban</p>
            </div>
            <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Tháng 04/2026</span>
          </div>

          <div class="mt-6 space-y-4">
            @for (item of departmentPayroll(); track item.department) {
              <div>
                <div class="flex items-center justify-between text-sm">
                  <span class="font-medium text-slate-700">{{ item.department }}</span>
                  <span class="text-slate-500">{{ item.total | currency:'VND':'symbol':'1.0-0' }}</span>
                </div>
                <div class="mt-2 h-3 rounded-full bg-slate-100">
                  <div class="h-3 rounded-full bg-indigo-500" [style.width.%]="item.share"></div>
                </div>
              </div>
            }
          </div>
        </article>

        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 class="text-lg font-semibold text-slate-900">Chỉ số chính</h4>
          <div class="mt-4 space-y-4">
            <div>
              <div class="flex justify-between text-sm">
                <span class="text-slate-600">Tỷ lệ giữ chân</span>
                <span class="font-semibold text-slate-900">94%</span>
              </div>
              <div class="mt-2 h-2 rounded-full bg-slate-100">
                <div class="h-2 w-[94%] rounded-full bg-emerald-500"></div>
              </div>
            </div>
            <div>
              <div class="flex justify-between text-sm">
                <span class="text-slate-600">Tổng ngân sách lương</span>
                <span class="font-semibold text-slate-900">{{ totalGross() | currency:'VND':'symbol':'1.0-0' }}</span>
              </div>
            </div>
            <div>
              <div class="flex justify-between text-sm">
                <span class="text-slate-600">Số nhân viên</span>
                <span class="font-semibold text-slate-900">{{ employees().length }}</span>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h4 class="text-lg font-semibold text-slate-900">Danh sách lương nhân viên</h4>
            <p class="text-sm text-slate-500">Tìm kiếm, xem chi tiết và chỉnh sửa ngay trên bảng</p>
          </div>
          <div class="flex flex-col gap-2 sm:flex-row">
            <input
              class="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500 sm:w-72"
              placeholder="Tìm theo tên, phòng ban, chức danh..."
              [value]="search()"
              (input)="search.set($any($event.target).value); currentPage.set(1)"
            />
          </div>
        </div>

        <div class="mt-4 overflow-hidden rounded-xl border border-slate-200">
          <table class="min-w-full divide-y divide-slate-200 text-sm">
            <thead class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th class="px-4 py-3">Nhân viên</th>
                <th class="px-4 py-3">Phòng ban</th>
                <th class="px-4 py-3">Chức danh</th>
                <th class="px-4 py-3">Gross</th>
                <th class="px-4 py-3">Net</th>
                <th class="px-4 py-3">Thâm niên</th>
                <th class="px-4 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              @for (employee of pagedEmployees(); track employee.id) {
                <tr class="hover:bg-slate-50">
                  <td class="px-4 py-3">
                    <div class="font-medium text-slate-900">{{ employee.name }}</div>
                    <div class="text-xs text-slate-500">Lần tăng lương: {{ employee.raiseCount }}</div>
                  </td>
                  <td class="px-4 py-3 text-slate-700">{{ employee.department }}</td>
                  <td class="px-4 py-3 text-slate-700">{{ employee.position }}</td>
                  <td class="px-4 py-3 text-slate-700">{{ employee.grossSalary | currency:'VND':'symbol':'1.0-0' }}</td>
                  <td class="px-4 py-3 font-medium text-emerald-700">{{ employee.netSalary | currency:'VND':'symbol':'1.0-0' }}</td>
                  <td class="px-4 py-3 text-slate-700">{{ employee.yearsWorked }} năm</td>
                  <td class="px-4 py-3 text-right">
                    <button
                      class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      type="button"
                      (click)="openDetail(employee.id)"
                    >
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              }
              @if (filteredEmployees().length === 0) {
                <tr>
                  <td class="px-4 py-8 text-center text-slate-500" colspan="7">Không tìm thấy nhân viên phù hợp.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="mt-4 flex items-center justify-between gap-3 text-sm text-slate-600">
          <div>
            Đang hiển thị <span class="font-semibold text-slate-900">{{ paginationStart() }}-{{ paginationEnd() }}</span>
            trên <span class="font-semibold text-slate-900">{{ filteredEmployees().length }}</span> nhân viên
          </div>
          <div class="flex items-center gap-2">
            <button
              class="rounded-lg border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 disabled:opacity-40"
              type="button"
              [disabled]="currentPage() === 1"
              (click)="currentPage.set(currentPage() - 1)"
            >
              Trước
            </button>
            <span class="rounded-lg bg-slate-100 px-3 py-2 font-medium text-slate-700">
              Trang {{ currentPage() }} / {{ totalPages() }}
            </span>
            <button
              class="rounded-lg border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 disabled:opacity-40"
              type="button"
              [disabled]="currentPage() >= totalPages()"
              (click)="currentPage.set(currentPage() + 1)"
            >
              Sau
            </button>
          </div>
        </div>
      </section>

      <section class="grid gap-4 xl:grid-cols-2">
        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 class="text-lg font-semibold text-slate-900">Quá trình tăng lương</h4>
          <div class="mt-4 space-y-4">
            @for (event of raiseHistory(); track event.date + event.employee) {
              <div class="rounded-xl border border-slate-200 p-4">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <div class="font-medium text-slate-900">{{ event.employee }}</div>
                    <div class="text-sm text-slate-500">{{ event.reason }}</div>
                  </div>
                  <span class="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{{ event.date | date:'dd/MM/yyyy' }}</span>
                </div>
                <div class="mt-3 text-sm text-slate-600">
                  {{ event.from | currency:'VND':'symbol':'1.0-0' }} →
                  <span class="font-semibold text-slate-900">{{ event.to | currency:'VND':'symbol':'1.0-0' }}</span>
                </div>
              </div>
            }
          </div>
        </article>

        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 class="text-lg font-semibold text-slate-900">Số năm làm việc</h4>
          <div class="mt-4 grid gap-4 md:grid-cols-2">
            @for (employee of employees(); track employee.id) {
              <div class="rounded-xl bg-slate-50 p-4">
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <div class="font-medium text-slate-900">{{ employee.name }}</div>
                    <div class="text-xs text-slate-500">{{ employee.department }}</div>
                  </div>
                  <span class="rounded-full bg-white px-3 py-1 text-sm font-semibold text-indigo-700">{{ employee.yearsWorked }} năm</span>
                </div>
                <div class="mt-3 h-2 rounded-full bg-slate-200">
                  <div class="h-2 rounded-full bg-emerald-500" [style.width.%]="employee.yearsWorked * 12"></div>
                </div>
                <div class="mt-2 text-xs text-slate-500">Tăng lương gần nhất: {{ employee.lastRaiseAt | date:'dd/MM/yyyy' }}</div>
              </div>
            }
          </div>
        </article>
      </section>
    </div>

    @if (selectedEmployee()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" (click)="closeDetail()">
        <div class="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-xl" (click)="$event.stopPropagation()">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h4 class="text-xl font-semibold text-slate-900">Chi tiết lương nhân viên</h4>
              <p class="text-sm text-slate-500">Sửa lương trực tiếp rồi lưu lại</p>
            </div>
            <button class="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600" type="button" (click)="closeDetail()">Đóng</button>
          </div>

          <form class="mt-4 grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4" [formGroup]="detailForm">
            <div class="grid gap-3 md:grid-cols-2">
              <div>
                <label class="text-xs font-medium text-slate-600">Nhân viên</label>
                <input class="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" formControlName="name" />
              </div>
              <div>
                <label class="text-xs font-medium text-slate-600">Phòng ban</label>
                <input class="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" formControlName="department" />
              </div>
              <div>
                <label class="text-xs font-medium text-slate-600">Chức danh</label>
                <input class="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" formControlName="position" />
              </div>
              <div>
                <label class="text-xs font-medium text-slate-600">Thâm niên (năm)</label>
                <input class="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" type="number" formControlName="yearsWorked" />
              </div>
              <div>
                <label class="text-xs font-medium text-slate-600">Gross</label>
                <input class="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" type="number" formControlName="grossSalary" />
              </div>
              <div>
                <label class="text-xs font-medium text-slate-600">Phụ cấp</label>
                <input class="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" type="number" formControlName="allowance" />
              </div>
            </div>
            <div class="grid gap-3 md:grid-cols-2">
              <div>
                <label class="text-xs font-medium text-slate-600">Ngày áp dụng</label>
                <input class="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" type="date" formControlName="lastRaiseAt" />
              </div>
              <div>
                <label class="text-xs font-medium text-slate-600">Lần tăng lương</label>
                <input class="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" type="number" formControlName="raiseCount" />
              </div>
            </div>

            <div class="flex justify-end gap-2">
              <button class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700" type="button" (click)="closeDetail()">Huỷ</button>
              <button class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white" type="button" (click)="saveDetail()">Lưu thay đổi</button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PayrollDetailComponent {
  private readonly fb = inject(FormBuilder);

  readonly search = signal('');
  readonly currentPage = signal(1);
  readonly pageSize = signal(5);
  readonly selectedEmployeeId = signal<string | null>(null);

  readonly employees = signal<PayrollEmployee[]>([
    {
      id: 'emp-01',
      name: 'Nguyễn Minh Anh',
      department: 'Nhân sự',
      position: 'HR Manager',
      grossSalary: 42000000,
      allowance: 1500000,
      netSalary: 34740000,
      raiseCount: 3,
      yearsWorked: 6,
      lastRaiseAt: '2025-12-15'
    },
    {
      id: 'emp-02',
      name: 'Trần Quốc Huy',
      department: 'Kinh doanh',
      position: 'Sales Lead',
      grossSalary: 38000000,
      allowance: 1000000,
      netSalary: 31400000,
      raiseCount: 2,
      yearsWorked: 4,
      lastRaiseAt: '2025-10-01'
    },
    {
      id: 'emp-03',
      name: 'Lê Thảo Vy',
      department: 'Tài chính',
      position: 'Payroll Specialist',
      grossSalary: 28000000,
      allowance: 1000000,
      netSalary: 23100000,
      raiseCount: 4,
      yearsWorked: 7,
      lastRaiseAt: '2026-01-01'
    },
    {
      id: 'emp-04',
      name: 'Phạm Gia Bảo',
      department: 'Vận hành',
      position: 'Operations Analyst',
      grossSalary: 25000000,
      allowance: 500000,
      netSalary: 20600000,
      raiseCount: 1,
      yearsWorked: 2,
      lastRaiseAt: '2025-08-20'
    }
  ]);

  readonly raiseHistory = signal<SalaryRaiseEvent[]>([
    { date: '2026-01-12', employee: 'Lê Thảo Vy', reason: 'Hoàn thành KPI năm 2025', from: 25000000, to: 28000000 },
    { date: '2025-12-05', employee: 'Nguyễn Minh Anh', reason: 'Bổ nhiệm quản lý nhân sự', from: 38000000, to: 42000000 },
    { date: '2025-10-18', employee: 'Trần Quốc Huy', reason: 'Mở rộng thị trường miền Nam', from: 32000000, to: 38000000 },
    { date: '2025-08-20', employee: 'Phạm Gia Bảo', reason: 'Tăng lương định kỳ', from: 22000000, to: 25000000 }
  ]);

  readonly detailForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    department: ['', Validators.required],
    position: ['', Validators.required],
    grossSalary: [0, [Validators.required, Validators.min(0)]],
    allowance: [0, [Validators.required, Validators.min(0)]],
    yearsWorked: [0, [Validators.required, Validators.min(0)]],
    lastRaiseAt: ['', Validators.required],
    raiseCount: [0, [Validators.required, Validators.min(0)]]
  });

  readonly selectedEmployee = computed(() => {
    const id = this.selectedEmployeeId();
    return id ? this.employees().find((employee) => employee.id === id) ?? null : null;
  });

  readonly totalGross = computed(() => this.employees().reduce((sum, item) => sum + item.grossSalary, 0));

  readonly summaryCards = computed(() => [
    {
      label: 'Tổng quỹ lương gross',
      value: this.totalGross().toLocaleString('vi-VN') + ' đ',
      note: 'Tổng lương trước bảo hiểm và thuế'
    },
    {
      label: 'Lương net trung bình',
      value: Math.round(this.employees().reduce((sum, item) => sum + item.netSalary, 0) / this.employees().length).toLocaleString('vi-VN') + ' đ',
      note: 'Thực nhận bình quân của nhân viên'
    },
    {
      label: 'Số lần tăng lương',
      value: this.employees().reduce((sum, item) => sum + item.raiseCount, 0).toString(),
      note: 'Tổng số quyết định tăng lương'
    },
    {
      label: 'Thâm niên trung bình',
      value: (this.employees().reduce((sum, item) => sum + item.yearsWorked, 0) / this.employees().length).toFixed(1) + ' năm',
      note: 'Dùng để theo dõi ổn định đội ngũ'
    }
  ]);

  readonly filteredEmployees = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.employees();
    return this.employees().filter((employee) =>
      [employee.name, employee.department, employee.position].some((field) => field.toLowerCase().includes(q))
    );
  });

  readonly totalPages = computed(() => {
    const pages = Math.ceil(this.filteredEmployees().length / this.pageSize());
    return Math.max(pages, 1);
  });

  readonly pagedEmployees = computed(() => {
    const page = Math.min(this.currentPage(), this.totalPages());
    if (page !== this.currentPage()) {
      this.currentPage.set(page);
    }
    const start = (page - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredEmployees().slice(start, end);
  });

  readonly paginationStart = computed(() => {
    if (this.filteredEmployees().length === 0) {
      return 0;
    }
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  readonly paginationEnd = computed(() => {
    return Math.min(this.currentPage() * this.pageSize(), this.filteredEmployees().length);
  });

  readonly departmentPayroll = computed(() => {
    const departments = Array.from(
      this.employees().reduce((map, employee) => {
        map.set(employee.department, (map.get(employee.department) ?? 0) + employee.grossSalary);
        return map;
      }, new Map<string, number>())
    ).map(([department, total]) => ({ department, total }));

    const max = Math.max(...departments.map((item) => item.total), 1);
    return departments.map((item) => ({ ...item, share: Math.round((item.total / max) * 100) }));
  });

  openDetail(employeeId: string): void {
    this.selectedEmployeeId.set(employeeId);
    const employee = this.employees().find((item) => item.id === employeeId);
    if (!employee) return;

    this.detailForm.reset({
      name: employee.name,
      department: employee.department,
      position: employee.position,
      grossSalary: employee.grossSalary,
      allowance: employee.allowance,
      yearsWorked: employee.yearsWorked,
      lastRaiseAt: employee.lastRaiseAt,
      raiseCount: employee.raiseCount
    });
  }

  closeDetail(): void {
    this.selectedEmployeeId.set(null);
  }

  saveDetail(): void {
    const employee = this.selectedEmployee();
    if (!employee || this.detailForm.invalid) {
      this.detailForm.markAllAsTouched();
      return;
    }

    const value = this.detailForm.getRawValue();
    const netSalary = Math.round(value.grossSalary * 0.83);

    this.employees.update((items) =>
      items.map((item) =>
        item.id === employee.id
          ? {
              ...item,
              name: value.name,
              department: value.department,
              position: value.position,
              grossSalary: value.grossSalary,
              allowance: value.allowance,
              netSalary,
              yearsWorked: value.yearsWorked,
              lastRaiseAt: value.lastRaiseAt,
              raiseCount: value.raiseCount
            }
          : item
      )
    );

    this.closeDetail();
  }

  exportExcel(): void {
    const header = ['Tên', 'Phòng ban', 'Chức danh', 'Gross', 'Phụ cấp', 'Net', 'Thâm niên', 'Số lần tăng lương', 'Ngày áp dụng'];
    const rows = this.employees().map((employee) => [
      employee.name,
      employee.department,
      employee.position,
      employee.grossSalary,
      employee.allowance,
      employee.netSalary,
      employee.yearsWorked,
      employee.raiseCount,
      employee.lastRaiseAt
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bao-cao-luong.csv';
    link.click();
    URL.revokeObjectURL(url);
  }
}
