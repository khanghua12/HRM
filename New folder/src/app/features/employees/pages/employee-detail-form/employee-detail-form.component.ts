import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { debounceTime, distinctUntilChanged, firstValueFrom, map, switchMap } from 'rxjs';
import type { MenuKey } from '../../../../core/services/auth.service';
import { EmployeesStore } from '../../services/employees-mock.store';
import { EmployeeAccountStore } from '../../services/employee-account.store';

@Component({
  selector: 'app-employee-detail-form',
  standalone: true,
  imports: [ReactiveFormsModule, AsyncPipe, LucideAngularModule],
  template: `
    <section class="rounded-sm border border-slate-200 bg-white">
      <div class="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h3 class="text-base font-semibold text-slate-900">
          {{ isCreateMode() ? 'TẠO NHÂN VIÊN MỚI' : 'THÔNG TIN NHÂN VIÊN' }}
        </h3>
        <button
          type="button"
          class="rounded px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
          (click)="close()"
          aria-label="Đóng"
        >
          ✕
        </button>
      </div>

      <div class="px-4 py-4">
        <h4 class="text-sm font-semibold text-slate-900">Thông tin làm việc</h4>

        <form class="mt-4" [formGroup]="form">
          <div class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3 xl:grid-cols-4">
            <div>
              <label class="text-xs text-slate-600">Họ và tên (*)</label>
              <input class="mt-1 h-9 w-full rounded border border-slate-200 px-2 text-sm outline-none focus:border-indigo-500" formControlName="fullName" />
            </div>

            <div>
              <label class="text-xs text-slate-600">Phòng ban (*)</label>
              <select class="mt-1 h-9 w-full rounded border border-slate-200 px-2 text-sm outline-none focus:border-indigo-500" formControlName="department">
                @for (d of departments; track d) {
                  <option [value]="d">{{ d }}</option>
                }
              </select>
            </div>

            <div>
              <label class="text-xs text-slate-600">Cấp bậc chuyên môn</label>
              <select class="mt-1 h-9 w-full rounded border border-slate-200 px-2 text-sm outline-none focus:border-indigo-500" formControlName="professionalLevel">
                @for (d of levels; track d) {
                  <option [value]="d">{{ d }}</option>
                }
              </select>
            </div>

            <div>
              <label class="text-xs text-slate-600">Ngày vào đơn vị</label>
              <input type="date" class="mt-1 h-9 w-full rounded border border-slate-200 px-2 text-sm outline-none focus:border-indigo-500" formControlName="joinedOrgAt" />
            </div>

            <div>
              <label class="text-xs text-slate-600">Ngày thử việc</label>
              <input type="date" class="mt-1 h-9 w-full rounded border border-slate-200 px-2 text-sm outline-none focus:border-indigo-500" formControlName="probationStartAt" />
            </div>

            <div>
              <label class="text-xs text-slate-600">Chức danh nghề nghiệp (*)</label>
              <input class="mt-1 h-9 w-full rounded border border-slate-200 px-2 text-sm outline-none focus:border-indigo-500" formControlName="title" />
            </div>

            <div>
              <label class="text-xs text-slate-600">Thâm niên</label>
              <input class="mt-1 h-9 w-full rounded border border-slate-200 px-2 text-sm outline-none focus:border-indigo-500" formControlName="seniority" />
            </div>

            <div>
              <label class="text-xs text-slate-600">Ngày học việc</label>
              <input type="date" class="mt-1 h-9 w-full rounded border border-slate-200 px-2 text-sm outline-none focus:border-indigo-500" formControlName="traineeStartAt" />
            </div>

            <div>
              <label class="text-xs text-slate-600">Ngày kết thúc thử việc</label>
              <input type="date" class="mt-1 h-9 w-full rounded border border-slate-200 px-2 text-sm outline-none focus:border-indigo-500" formControlName="probationEndAt" />
            </div>

            <div>
              <label class="text-xs text-slate-600">Chức vụ</label>
              <input class="mt-1 h-9 w-full rounded border border-slate-200 px-2 text-sm outline-none focus:border-indigo-500" formControlName="position" />
            </div>

            <div>
              <label class="text-xs text-slate-600">Email làm việc</label>
              <input type="email" class="mt-1 h-9 w-full rounded border border-slate-200 px-2 text-sm outline-none focus:border-indigo-500" formControlName="workEmail" />
            </div>

            <div>
              <label class="text-xs text-slate-600">Ngày vào thực tập</label>
              <input type="date" class="mt-1 h-9 w-full rounded border border-slate-200 px-2 text-sm outline-none focus:border-indigo-500" formControlName="internStartAt" />
            </div>

            <div>
              <label class="text-xs text-slate-600">Ngày chính thức</label>
              <input type="date" class="mt-1 h-9 w-full rounded border border-slate-200 px-2 text-sm outline-none focus:border-indigo-500" formControlName="officialAt" />
            </div>

            <div>
              <label class="text-xs text-slate-600">Nhóm vị trí làm việc</label>
              <input class="mt-1 h-9 w-full rounded border border-slate-200 px-2 text-sm outline-none focus:border-indigo-500" formControlName="positionGroup" />
            </div>

            <div>
              <label class="text-xs text-slate-600">Mã chấm công</label>
              <input class="mt-1 h-9 w-full rounded border border-slate-200 px-2 text-sm outline-none focus:border-indigo-500" formControlName="timekeepingCode" />
            </div>

            <div>
              <label class="text-xs text-slate-600">Ngày kết thúc thực tập</label>
              <input type="date" class="mt-1 h-9 w-full rounded border border-slate-200 px-2 text-sm outline-none focus:border-indigo-500" formControlName="internEndAt" />
            </div>

            <div>
              <label class="text-xs text-slate-600">Ngày xét duyệt phép</label>
              <input type="date" class="mt-1 h-9 w-full rounded border border-slate-200 px-2 text-sm outline-none focus:border-indigo-500" formControlName="leaveApprovalAt" />
            </div>

            <div>
              <label class="text-xs text-slate-600">Ngày bổ nhiệm</label>
              <input type="date" class="mt-1 h-9 w-full rounded border border-slate-200 px-2 text-sm outline-none focus:border-indigo-500" formControlName="appointedAt" />
            </div>

            <div>
              <label class="text-xs text-slate-600">Số hợp đồng</label>
              <input class="mt-1 h-9 w-full rounded border border-slate-200 px-2 text-sm outline-none focus:border-indigo-500" formControlName="contractNumber" />
            </div>

            <div>
              <label class="text-xs text-slate-600">Ngày bổ nhiệm lại</label>
              <input type="date" class="mt-1 h-9 w-full rounded border border-slate-200 px-2 text-sm outline-none focus:border-indigo-500" formControlName="reappointedAt" />
            </div>

            <div>
              <label class="text-xs text-slate-600">Ngày bắt đầu đóng BHXH</label>
              <input type="date" class="mt-1 h-9 w-full rounded border border-slate-200 px-2 text-sm outline-none focus:border-indigo-500" formControlName="socialInsuranceStartAt" />
            </div>

            <div>
              <label class="text-xs text-slate-600">Loại hợp đồng</label>
              <select class="mt-1 h-9 w-full rounded border border-slate-200 px-2 text-sm outline-none focus:border-indigo-500" formControlName="contractType">
                @for (d of contractTypes; track d) {
                  <option [value]="d">{{ d }}</option>
                }
              </select>
            </div>

            <div>
              <label class="text-xs text-slate-600">Nơi làm việc</label>
              <input class="mt-1 h-9 w-full rounded border border-slate-200 px-2 text-sm outline-none focus:border-indigo-500" formControlName="workplace" />
            </div>

            <div>
              <label class="text-xs text-slate-600">Tài khoản đăng nhập</label>
              <input class="mt-1 h-9 w-full rounded border border-slate-200 px-2 text-sm outline-none focus:border-indigo-500" formControlName="username" />
            </div>

            <div>
              <label class="text-xs text-slate-600">Phân loại nhân viên</label>
              <select class="mt-1 h-9 w-full rounded border border-slate-200 px-2 text-sm outline-none focus:border-indigo-500" formControlName="classification">
                @for (d of classifications; track d.value) {
                  <option [value]="d.value">{{ d.label }}</option>
                }
              </select>
            </div>

            <div class="md:col-span-2 xl:col-span-2">
              <label class="text-xs text-slate-600">Quản lý trực tiếp</label>
              <div class="mt-1 grid grid-cols-1 gap-2 md:grid-cols-2">
                <input
                  class="h-9 w-full rounded border border-slate-200 px-2 text-sm outline-none focus:border-indigo-500"
                  [value]="managerQuery()"
                  (input)="managerQuery.set($any($event.target).value)"
                  placeholder="Nhập tên để tìm..."
                />
                <select
                  class="h-9 w-full rounded border border-slate-200 bg-white px-2 text-sm outline-none focus:border-indigo-500"
                  formControlName="directManagerId"
                >
                  @if (managerOptions$ | async; as ops) {
                    @for (m of ops; track m.id) {
                      <option [value]="m.id">{{ m.name }}</option>
                    }
                  }
                </select>
              </div>
            </div>

            <div class="md:col-span-1 xl:col-span-2">
              <label class="text-xs text-slate-600">Vị trí công việc độc hại</label>
              <input class="mt-1 h-9 w-full rounded border border-slate-200 px-2 text-sm outline-none focus:border-indigo-500" formControlName="hazardousWorkPosition" />
            </div>
          </div>

          <div class="mt-6 flex justify-end gap-2">
            <button type="button" class="h-9 rounded border border-slate-200 bg-white px-4 text-sm hover:bg-slate-50" (click)="close()">
              Đóng
            </button>
            <button
              type="button"
              class="h-9 rounded bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
              [disabled]="form.invalid"
              (click)="saveEmployee()"
            >
              {{ isCreateMode() ? 'Tạo nhân viên' : 'Lưu thông tin' }}
            </button>
          </div>
        </form>
      </div>
    </section>

    <section class="mt-4 rounded-sm border border-slate-200 bg-white p-4">
      <div class="mb-3 flex items-center justify-between gap-2">
        <div>
          <h4 class="text-sm font-semibold text-slate-900">Tài khoản & Phân quyền menu</h4>
          <p class="text-xs text-slate-500">Nhân viên chỉ đăng nhập được khi đã tạo tài khoản và được bật hoạt động.</p>
        </div>
      </div>

      <form [formGroup]="accountForm" class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <label class="text-xs text-slate-600">Email đăng nhập (*)</label>
          <input class="mt-1 h-9 w-full rounded border border-slate-200 px-2 text-sm outline-none focus:border-indigo-500" formControlName="email" />
        </div>

        <div>
          <label class="text-xs text-slate-600">Username hiển thị</label>
          <input class="mt-1 h-9 w-full rounded border border-slate-200 px-2 text-sm outline-none focus:border-indigo-500" formControlName="username" />
        </div>

        <div>
          <label class="text-xs text-slate-600">Mật khẩu (*)</label>
          <input type="password" class="mt-1 h-9 w-full rounded border border-slate-200 px-2 text-sm outline-none focus:border-indigo-500" formControlName="password" />
        </div>

        <div class="flex items-end">
          <label class="inline-flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" formControlName="active" />
            Kích hoạt tài khoản
          </label>
        </div>
      </form>

      <div class="mt-4">
        <p class="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Phân quyền menu</p>
        <div class="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
          @for (m of menuOptions; track m.key) {
            <label class="inline-flex items-center gap-2 rounded border border-slate-200 px-2 py-2 text-sm text-slate-700">
              <input
                type="checkbox"
                [checked]="selectedMenus().includes(m.key)"
                (change)="toggleMenuPermission(m.key, $any($event.target).checked)"
              />
              {{ m.label }}
            </label>
          }
        </div>
      </div>

      <div class="mt-4 flex justify-end gap-2">
        <button
          type="button"
          class="h-9 rounded bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          [disabled]="accountForm.invalid || employeeId() === ''"
          (click)="saveAccount()"
        >
          Lưu tài khoản
        </button>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeeDetailFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(EmployeesStore);
  private readonly accountStore = inject(EmployeeAccountStore);

  readonly departments = ['Phòng ban A', 'Phòng ban B', 'Phòng ban C'] as const;
  readonly levels = ['Cấp 1', 'Cấp 2', 'Cấp 3'] as const;
  readonly contractTypes = ['Xác định thời hạn', 'Không xác định thời hạn', 'Cộng tác'] as const;
  readonly classifications = [
    { value: 'active', label: 'Chính thức' },
    { value: 'onboarding', label: 'Onboard' },
    { value: 'probation', label: 'Thử việc' },
    { value: 'intern', label: 'Thực tập' },
    { value: 'trainee', label: 'Học việc' },
    { value: 'inactive', label: 'Nghỉ việc' }
  ] as const;

  readonly menuOptions: Array<{ key: MenuKey; label: string }> = [
    { key: 'employees', label: 'Nhân viên' },
    { key: 'recruitment', label: 'Tuyển dụng' },
    { key: 'payroll', label: 'Lương' },
    { key: 'performance', label: 'Hiệu suất' },
    { key: 'work', label: 'Công việc' },
    { key: 'training', label: 'Đào tạo' },
    { key: 'forms', label: 'Mẫu đơn' }
  ];

  readonly employeeId = signal('');
  readonly isCreateMode = computed(() => this.employeeId() === 'new');
  readonly selectedMenus = signal<MenuKey[]>(['employees']);

  readonly managerQuery = signal('');
  readonly managerOptions$ = toObservable(this.managerQuery).pipe(
    map((v) => v.trim()),
    debounceTime(200),
    distinctUntilChanged(),
    switchMap((q) => this.store.searchManagers(q))
  );

  readonly form = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    department: ['', Validators.required],
    title: ['', Validators.required],
    position: [''],
    positionGroup: [''],
    professionalLevel: [''],
    classification: ['active'],
    seniority: [''],
    workEmail: [''],
    timekeepingCode: [''],
    workplace: [''],
    contractType: [''],
    contractNumber: [''],
    username: [''],
    appointedAt: [''],
    reappointedAt: [''],
    joinedOrgAt: [''],
    traineeStartAt: [''],
    internStartAt: [''],
    internEndAt: [''],
    probationStartAt: [''],
    probationEndAt: [''],
    officialAt: [''],
    leaveApprovalAt: [''],
    socialInsuranceStartAt: [''],
    directManagerId: ['MGR-001'],
    hazardousWorkPosition: ['']
  });

  readonly accountForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    username: ['', Validators.required],
    password: ['', Validators.required],
    active: [true]
  });

  constructor() {
    this.route.paramMap
      .pipe(
        map((p) => p.get('id') ?? ''),
        switchMap((id) => {
          this.employeeId.set(id);
          return this.store.getDetail(id);
        })
      )
      .subscribe((detail) => {
        if (detail) {
          this.form.patchValue({
            fullName: detail.fullName ?? '',
            department: detail.department ?? '',
            title: detail.title ?? '',
            position: detail.position ?? '',
            positionGroup: detail.positionGroup ?? '',
            professionalLevel: detail.professionalLevel ?? '',
            classification: detail.classification ?? 'active',
            seniority: detail.seniority ?? '',
            workEmail: detail.workEmail ?? '',
            timekeepingCode: detail.timekeepingCode ?? '',
            workplace: detail.workplace ?? '',
            contractType: detail.contractType ?? '',
            contractNumber: detail.contractNumber ?? '',
            username: detail.username ?? '',
            appointedAt: detail.appointedAt ?? '',
            reappointedAt: detail.reappointedAt ?? '',
            joinedOrgAt: detail.joinedOrgAt ?? '',
            traineeStartAt: detail.traineeStartAt ?? '',
            internStartAt: detail.internStartAt ?? '',
            internEndAt: detail.internEndAt ?? '',
            probationStartAt: detail.probationStartAt ?? '',
            probationEndAt: detail.probationEndAt ?? '',
            officialAt: detail.officialAt ?? '',
            leaveApprovalAt: detail.leaveApprovalAt ?? '',
            socialInsuranceStartAt: detail.socialInsuranceStartAt ?? '',
            directManagerId: detail.directManagerId ?? 'MGR-001',
            hazardousWorkPosition: detail.hazardousWorkPosition ?? ''
          });
        }

        this.loadAccountState();
      });
  }

  close(): void {
    void this.router.navigate(['/employees/ho-so'], { queryParamsHandling: 'preserve' });
  }

  async saveEmployee(): Promise<void> {
    if (this.isCreateMode()) {
      try {
        await firstValueFrom(
          this.store.createEmployee({
            fullName: this.form.getRawValue().fullName,
            department: this.form.getRawValue().department,
            title: this.form.getRawValue().title,
            status: this.form.getRawValue().classification as any,
            gender: 'other',
            age: 25,
            educationLevel: 'Đại học',
            objectType: 'Chuyên môn',
            email: this.form.getRawValue().workEmail || ''
          })
        );
        window.alert('Đã tạo nhân viên mới.');
        this.close();
        return;
      } catch {
        window.alert('Không tạo được nhân viên. Kiểm tra API/MySQL.');
        return;
      }
    }
    try {
      await firstValueFrom(
        this.store.updateEmployee(this.employeeId(), {
          fullName: this.form.getRawValue().fullName,
          department: this.form.getRawValue().department,
          title: this.form.getRawValue().title,
          status: this.form.getRawValue().classification as any,
          gender: 'other',
          age: 25,
          educationLevel: 'Đại học',
          objectType: 'Chuyên môn',
          email: this.form.getRawValue().workEmail || ''
        })
      );
      window.alert('Đã cập nhật thông tin nhân viên.');
    } catch {
      window.alert('Không cập nhật được nhân viên. Kiểm tra API/MySQL.');
    }
  }

  toggleMenuPermission(menu: MenuKey, checked: boolean): void {
    const current = this.selectedMenus();
    if (checked) {
      if (!current.includes(menu)) this.selectedMenus.set([...current, menu]);
      return;
    }

    const next = current.filter((m) => m !== menu);
    this.selectedMenus.set(next.length > 0 ? next : ['employees']);
  }

  async saveAccount(): Promise<void> {
    const employeeId = this.employeeId();
    if (!employeeId || employeeId === 'new') {
      window.alert('Bạn cần tạo nhân viên trước khi tạo tài khoản đăng nhập.');
      return;
    }

    const payload = this.accountForm.getRawValue();
    try {
      await this.accountStore.upsert(employeeId, {
        email: payload.email.trim().toLowerCase(),
        username: payload.username.trim(),
        password: payload.password,
        active: payload.active,
        menuPermissions: this.selectedMenus()
      });
      window.alert('Đã lưu tài khoản và phân quyền menu cho nhân viên.');
    } catch {
      window.alert('Không lưu được tài khoản. Kiểm tra API/MySQL.');
    }
  }

  private async loadAccountState(): Promise<void> {
    const employeeId = this.employeeId();
    if (!employeeId || employeeId === 'new') return;

    const acc = await this.accountStore.getByEmployeeId(employeeId);
    if (!acc) {
      this.accountForm.patchValue({
        email: (this.form.getRawValue().workEmail || '').trim().toLowerCase(),
        username: this.form.getRawValue().username || '',
        password: '',
        active: true
      });
      this.selectedMenus.set(['employees']);
      return;
    }

    this.accountForm.patchValue({
      email: acc.email,
      username: acc.username,
      password: acc.password,
      active: acc.active
    });
    this.selectedMenus.set(acc.menuPermissions.length > 0 ? acc.menuPermissions : ['employees']);
  }
}
