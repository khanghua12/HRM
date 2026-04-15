import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { debounceTime, distinctUntilChanged, map, switchMap } from 'rxjs';
import { EmployeesMockStore } from '../../services/employees-mock.store';

@Component({
  selector: 'app-employee-detail-form',
  standalone: true,
  imports: [ReactiveFormsModule, AsyncPipe, LucideAngularModule],
  template: `
    <section class="rounded-sm border border-slate-200 bg-white">
      <div class="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h3 class="text-base font-semibold text-slate-900">THÔNG TIN NHÂN VIÊN</h3>
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
            <!-- Column 1 -->
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

            <!-- Column 2 -->
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

            <!-- Column 3 -->
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

            <!-- Column 4 -->
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

            <!-- Row continuation (like screenshot: many fields, keep 3-4 columns) -->
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

            <!-- Special: direct manager lookup -->
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
              (click)="save()"
            >
              Lưu
            </button>
          </div>
        </form>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeeDetailFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(EmployeesMockStore);

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

  readonly managerQuery = signal('');
  readonly managerOptions$ = toObservable(this.managerQuery).pipe(
    map((v) => v.trim()),
    debounceTime(200),
    distinctUntilChanged(),
    switchMap((q) => this.store.searchManagers(q))
  );

  readonly form = this.fb.nonNullable.group({
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

  constructor() {
    this.route.paramMap
      .pipe(
        map((p) => p.get('id') ?? ''),
        switchMap((id) => this.store.getDetail(id))
      )
      .subscribe((detail) => {
        if (!detail) return;
        this.form.patchValue({
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
      });
  }

  close(): void {
    void this.router.navigate(['/employees/ho-so'], { queryParamsHandling: 'preserve' });
  }

  save(): void {
    window.alert('Mock: Đã lưu thông tin làm việc.');
  }
}

