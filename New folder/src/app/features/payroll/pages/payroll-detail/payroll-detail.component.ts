import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

interface SalaryEmployee {
  id: string;
  name: string;
  department: string;
  position: string;
  grossSalary: number;
  workingDays: number;
  salary: number;
  bhxh: number;
  tax: number;
  advanceDeduction: number;
  totalDeductions: number;
  lunchAllowance: number;
  transportAllowance: number;
  attendanceAllowance: number;
  responsibilityAllowance: number;
  businessTripAllowance: number;
  leaveDays: number;
  holidayDays: number;
  leavePay: number;
  holidayPay: number;
  totalSupplementaryIncome: number;
  allowances: number;
  referralMoney: number;
  bonusAmount: number;
  otherDeductions: number;
  netSalary: number;
  raiseCount: number;
  yearsWorked: number;
  lastRaiseAt: string;
}

@Component({
  selector: 'app-payroll-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <div class="rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 p-6 text-white shadow-sm">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-2xl space-y-2">
            <p class="text-sm/6 uppercase tracking-[0.2em] text-indigo-100">Lương</p>
            <h3 class="text-3xl font-semibold">Quản lý lương nhân viên</h3>
            <p class="text-sm text-indigo-50">
              Quản lý bảng lương, theo dõi thay đổi thu nhập và xuất báo cáo ngay trong một khu vực.
            </p>
          </div>
          <button
            class="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/30 hover:bg-white/15"
            type="button"
            (click)="exportExcel()"
          >
            Xuất Excel tổng hợp
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
                (input)="onSearchInput($event)"
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
                  <th class="px-4 py-3">Lương cơ bản</th>
                  <th class="px-4 py-3">Thực nhận</th>
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
                    <td class="px-4 py-3 font-semibold text-red-600">{{ employee.netSalary | currency:'VND':'symbol':'1.0-0' }}</td>
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
                    <td class="px-4 py-8 text-center text-slate-500" colspan="6">Không tìm thấy nhân viên phù hợp.</td>
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
              <button class="rounded-lg border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 disabled:opacity-40" type="button" [disabled]="currentPage() === 1" (click)="currentPage.set(currentPage() - 1)">Trước</button>
              <span class="rounded-lg bg-slate-100 px-3 py-2 font-medium text-slate-700">Trang {{ currentPage() }} / {{ totalPages() }}</span>
              <button class="rounded-lg border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 disabled:opacity-40" type="button" [disabled]="currentPage() >= totalPages()" (click)="currentPage.set(currentPage() + 1)">Sau</button>
            </div>
          </div>
        </article>

        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 class="text-lg font-semibold text-slate-900">Tổng quan lương</h4>
          <div class="mt-4 space-y-3 text-sm">
            <div class="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span class="text-slate-600">Tổng quỹ lương</span>
              <span class="font-semibold text-slate-900">{{ totalGross() | currency:'VND':'symbol':'1.0-0' }}</span>
            </div>
            <div class="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span class="text-slate-600">Lương trung bình</span>
              <span class="font-semibold text-slate-900">{{ averageGross() | currency:'VND':'symbol':'1.0-0' }}</span>
            </div>
            <div class="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span class="text-slate-600">Số phòng ban</span>
              <span class="font-semibold text-slate-900">{{ departmentCount() }}</span>
            </div>
            <div class="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span class="text-slate-600">Số nhân viên</span>
              <span class="font-semibold text-slate-900">{{ employees().length }}</span>
            </div>
          </div>

          <div class="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div class="flex items-center justify-between gap-2">
              <div>
                <h5 class="text-sm font-semibold text-slate-900">Range lương nhân viên</h5>
                <p class="text-xs text-slate-500">Phân bố mức lương cơ bản theo từng khoảng</p>
              </div>
              <span class="rounded-full bg-white px-2 py-1 text-xs font-medium text-slate-600">{{ salaryBands().length }} khoảng</span>
            </div>

            <div class="mt-4 space-y-3">
              @for (band of salaryBands(); track band.label) {
                <div>
                  <div class="mb-1 flex items-center justify-between text-xs text-slate-600">
                    <span>{{ band.label }}</span>
                    <span>{{ band.count }} nhân viên</span>
                  </div>
                  <div class="h-3 rounded-full bg-slate-200">
                    <div class="h-3 rounded-full bg-indigo-500" [style.width.%]="band.percent"></div>
                  </div>
                </div>
              }
            </div>
          </div>
        </article>
      </section>
    </div>

    @if (selectedEmployee()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" (click)="closeDetail()">
        <div class="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-xl" (click)="$event.stopPropagation()">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h4 class="text-xl font-semibold text-slate-900">Chi tiết lương nhân viên</h4>
              <p class="text-sm text-slate-500">Xem các khoản trừ và chỉnh sửa trực tiếp rồi lưu lại</p>
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
                <label class="text-xs font-medium text-slate-600">Lương cơ bản</label>
                <input class="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" type="number" formControlName="grossSalary" />
              </div>
              <div>
                <label class="text-xs font-medium text-slate-600">Thuế</label>
                <input class="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" type="number" formControlName="tax" />
              </div>
              <div>
                <label class="text-xs font-medium text-slate-600">BHXH</label>
                <input class="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" type="number" formControlName="bhxh" />
              </div>
              <div>
                <label class="text-xs font-medium text-slate-600">Phụ cấp</label>
                <input class="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" type="number" formControlName="allowances" />
              </div>
              <div>
                <label class="text-xs font-medium text-slate-600">Tiền giới thiệu</label>
                <input class="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" type="number" formControlName="referralMoney" />
              </div>
              <div>
                <label class="text-xs font-medium text-slate-600">Khoản thưởng</label>
                <input class="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" type="number" formControlName="bonusAmount" />
              </div>
              <div>
                <label class="text-xs font-medium text-slate-600">Các phí khác</label>
                <input class="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" type="number" formControlName="otherDeductions" />
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

  readonly employees = signal<SalaryEmployee[]>([
    { id: 'emp-01', name: 'Nguyễn Minh Anh', department: 'Nhân sự', position: 'HR Manager', grossSalary: 42000000, workingDays: 26, salary: 42000000, bhxh: 2100000, tax: 1200000, advanceDeduction: 300000, totalDeductions: 3600000, lunchAllowance: 600000, transportAllowance: 800000, attendanceAllowance: 400000, responsibilityAllowance: 500000, businessTripAllowance: 200000, leaveDays: 1, holidayDays: 0, leavePay: 1600000, holidayPay: 0, totalSupplementaryIncome: 3900000, allowances: 1800000, referralMoney: 500000, bonusAmount: 2500000, otherDeductions: 300000, netSalary: 40100000, raiseCount: 3, yearsWorked: 6, lastRaiseAt: '2025-12-15' },
    { id: 'emp-02', name: 'Trần Quốc Huy', department: 'Kinh doanh', position: 'Sales Lead', grossSalary: 38000000, workingDays: 26, salary: 38000000, bhxh: 1900000, tax: 1000000, advanceDeduction: 500000, totalDeductions: 3400000, lunchAllowance: 500000, transportAllowance: 700000, attendanceAllowance: 300000, responsibilityAllowance: 400000, businessTripAllowance: 300000, leaveDays: 0, holidayDays: 1, leavePay: 0, holidayPay: 1800000, totalSupplementaryIncome: 4000000, allowances: 1200000, referralMoney: 1000000, bonusAmount: 1800000, otherDeductions: 500000, netSalary: 37500000, raiseCount: 2, yearsWorked: 4, lastRaiseAt: '2025-10-01' },
    { id: 'emp-03', name: 'Lê Thảo Vy', department: 'Tài chính', position: 'Payroll Specialist', grossSalary: 28000000, workingDays: 25, salary: 28000000, bhxh: 1400000, tax: 800000, advanceDeduction: 200000, totalDeductions: 2400000, lunchAllowance: 400000, transportAllowance: 500000, attendanceAllowance: 250000, responsibilityAllowance: 300000, businessTripAllowance: 150000, leaveDays: 2, holidayDays: 0, leavePay: 1200000, holidayPay: 0, totalSupplementaryIncome: 2800000, allowances: 1000000, referralMoney: 0, bonusAmount: 1200000, otherDeductions: 200000, netSalary: 28200000, raiseCount: 4, yearsWorked: 7, lastRaiseAt: '2026-01-01' },
    { id: 'emp-04', name: 'Phạm Gia Bảo', department: 'Vận hành', position: 'Operations Analyst', grossSalary: 25000000, workingDays: 26, salary: 25000000, bhxh: 1250000, tax: 600000, advanceDeduction: 150000, totalDeductions: 2000000, lunchAllowance: 350000, transportAllowance: 450000, attendanceAllowance: 200000, responsibilityAllowance: 250000, businessTripAllowance: 100000, leaveDays: 1, holidayDays: 0, leavePay: 800000, holidayPay: 0, totalSupplementaryIncome: 2150000, allowances: 800000, referralMoney: 0, bonusAmount: 1000000, otherDeductions: 150000, netSalary: 25100000, raiseCount: 1, yearsWorked: 2, lastRaiseAt: '2025-08-20' }
  ]);

  readonly detailForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    department: ['', Validators.required],
    position: ['', Validators.required],
    grossSalary: [0, [Validators.required, Validators.min(0)]],
    tax: [0, [Validators.required, Validators.min(0)]],
    bhxh: [0, [Validators.required, Validators.min(0)]],
    allowances: [0, [Validators.required, Validators.min(0)]],
    referralMoney: [0, [Validators.required, Validators.min(0)]],
    bonusAmount: [0, [Validators.required, Validators.min(0)]],
    otherDeductions: [0, [Validators.required, Validators.min(0)]],
    yearsWorked: [0, [Validators.required, Validators.min(0)]],
    lastRaiseAt: ['', Validators.required],
    raiseCount: [0, [Validators.required, Validators.min(0)]]
  });

  readonly selectedEmployee = computed(() => {
    const id = this.selectedEmployeeId();
    return id ? this.employees().find((employee) => employee.id === id) ?? null : null;
  });

  readonly totalGross = computed(() => this.employees().reduce((sum, item) => sum + item.grossSalary, 0));
  readonly totalAllowances = computed(() => this.employees().reduce((sum, item) => sum + item.allowances, 0));
  readonly totalBonuses = computed(() => this.employees().reduce((sum, item) => sum + item.bonusAmount + item.referralMoney, 0));
  readonly averageGross = computed(() => Math.round(this.totalGross() / this.employees().length));
  readonly departmentCount = computed(() => new Set(this.employees().map((item) => item.department)).size);

  readonly summaryCards = computed(() => [
    { label: 'Tổng quỹ lương gross', value: this.totalGross().toLocaleString('vi-VN') + ' đ', note: 'Tổng lương trước bảo hiểm và thuế' },
    { label: 'Số nhân viên', value: this.employees().length.toString(), note: 'Đang có trong bảng lương' },
    { label: 'Lương trung bình', value: this.averageGross().toLocaleString('vi-VN') + ' đ', note: 'Trung bình theo dữ liệu hiện tại' },
    { label: 'Phòng ban', value: this.departmentCount().toString(), note: 'Các phòng ban đang quản lý' },
    { label: 'Tổng phụ cấp', value: this.totalAllowances().toLocaleString('vi-VN') + ' đ', note: 'Tổng phụ cấp của toàn bộ nhân viên' },
    { label: 'Tổng thưởng', value: this.totalBonuses().toLocaleString('vi-VN') + ' đ', note: 'Tiền thưởng nhập thêm bởi kế toán' }
  ]);

  readonly salaryBands = computed(() => {
    const salaries = this.employees().map((item) => item.grossSalary);
    if (salaries.length === 0) return [];
    const min = Math.min(...salaries);
    const max = Math.max(...salaries);
    const span = Math.max(max - min, 1);
    const step = Math.max(Math.round(span / 4 / 1000000) * 1000000, 1000000);
    const start = Math.floor(min / step) * step;
    const bands = Array.from({ length: 4 }, (_, index) => {
      const from = start + index * step;
      const to = from + step - 1;
      const count = this.employees().filter((item) => item.grossSalary >= from && item.grossSalary <= to).length;
      return {
        label: `${from.toLocaleString('vi-VN')} - ${to.toLocaleString('vi-VN')} đ`,
        count,
        percent: Math.max(Math.round((count / salaries.length) * 100), count > 0 ? 12 : 0)
      };
    });
    return bands;
  });

  readonly filteredEmployees = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.employees();
    return this.employees().filter((employee) => [employee.name, employee.department, employee.position].some((field) => field.toLowerCase().includes(q)));
  });

  readonly totalPages = computed(() => Math.max(Math.ceil(this.filteredEmployees().length / this.pageSize()), 1));
  readonly pagedEmployees = computed(() => {
    const page = Math.min(this.currentPage(), this.totalPages());
    const start = (page - 1) * this.pageSize();
    return this.filteredEmployees().slice(start, start + this.pageSize());
  });
  readonly paginationStart = computed(() => (this.filteredEmployees().length === 0 ? 0 : (this.currentPage() - 1) * this.pageSize() + 1));
  readonly paginationEnd = computed(() => Math.min(this.currentPage() * this.pageSize(), this.filteredEmployees().length));

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.search.set(target?.value ?? '');
    this.currentPage.set(1);
  }

  openDetail(employeeId: string): void {
    this.selectedEmployeeId.set(employeeId);
    const employee = this.employees().find((item) => item.id === employeeId);
    if (!employee) return;
    this.detailForm.reset({
      name: employee.name,
      department: employee.department,
      position: employee.position,
      grossSalary: employee.grossSalary,
      tax: employee.tax,
      bhxh: employee.bhxh,
      allowances: employee.allowances,
      referralMoney: employee.referralMoney,
      bonusAmount: employee.bonusAmount,
      otherDeductions: employee.otherDeductions,
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
    const netSalary = Math.max(
      0,
      Number(value.grossSalary) + Number(value.allowances ?? 0) + Number(value.referralMoney ?? 0) + Number(value.bonusAmount ?? 0) - Number(value.tax ?? 0) - Number(value.bhxh ?? 0) - Number(value.otherDeductions ?? 0)
    );
    this.employees.update((items) =>
      items.map((item) =>
        item.id === employee.id
          ? {
              ...item,
              name: value.name,
              department: value.department,
              position: value.position,
              grossSalary: value.grossSalary,
              tax: value.tax,
              bhxh: value.bhxh,
              allowances: value.allowances,
              referralMoney: value.referralMoney,
              bonusAmount: value.bonusAmount,
              otherDeductions: value.otherDeductions,
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

  async exportExcel(): Promise<void> {
    const XLSX = await import('xlsx');
    const workbook = XLSX.utils.book_new();

    const headers = [
      'Stt',
      'Họ và Tên',
      'Chức vụ',
      'Lương CB',
      'Ngày công',
      'Lương',
      'BHXH 10,5%',
      'Thuế TNCN',
      'Trừ tạm ứng',
      'Tổng các khoản khấu trừ',
      'Phụ cấp ăn trưa',
      'Hỗ trợ xăng xe, điện thoại',
      'Phụ cấp chuyên cần',
      'Phụ cấp trách nhiệm',
      'Phụ cấp công tác (nếu có)',
      'Tổng phụ cấp',
      'Ngày nghĩ phép',
      'Ngày nghỉ Lễ/Tết',
      'Tiền nghỉ phép, Lễ/Tết',
      'Tổng thu nhập bổ sung',
      'Thực lĩnh',
      'Công chuẩn',
      'Ăn trưa',
      'Xăng xe',
      'Chuyên cần',
      'Trách nhiệm',
      'Công tác',
      'Tổng thực nhận'
    ];

    const rows = this.employees().map((employee, index) => {
      const totalAllowances = employee.allowances;
      const totalSupplementaryIncome = employee.totalSupplementaryIncome;
      const totalDeductions = employee.totalDeductions;
      const grossPay = employee.salary;
      const actualReceived = Math.max(0, grossPay + totalAllowances + totalSupplementaryIncome - totalDeductions);

      return [
        index + 1,
        employee.name,
        employee.position,
        employee.grossSalary,
        employee.workingDays,
        grossPay,
        employee.bhxh,
        employee.tax,
        employee.advanceDeduction,
        totalDeductions,
        employee.lunchAllowance,
        employee.transportAllowance,
        employee.attendanceAllowance,
        employee.responsibilityAllowance,
        employee.businessTripAllowance,
        totalAllowances,
        employee.leaveDays,
        employee.holidayDays,
        employee.leavePay + employee.holidayPay,
        totalSupplementaryIncome,
        employee.netSalary,
        26,
        employee.lunchAllowance,
        employee.transportAllowance,
        employee.attendanceAllowance,
        employee.responsibilityAllowance,
        employee.businessTripAllowance,
        actualReceived
      ];
    });

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    worksheet['!cols'] = headers.map((header) => ({ wch: Math.max(header.length + 2, 14) }));
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bảng tính lương');

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bang-tinh-luong-tong-hop.xlsx';
    link.click();
    URL.revokeObjectURL(url);
  }
}
