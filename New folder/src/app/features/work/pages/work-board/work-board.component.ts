import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

interface WorkItem {
  id: string;
  taskName: string;
  description: string;
  assignee: string;
  assignedAt: string;
  deadline: string;
  progress: number;
  priority: 'Cao' | 'Trung bình' | 'Thấp';
  status: 'Mới' | 'Đang xử lý' | 'Hoàn tất';
}

@Component({
  selector: 'app-work-board',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <div class="rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-700 p-6 text-white shadow-sm">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-2xl space-y-2">
            <p class="text-sm/6 uppercase tracking-[0.2em] text-slate-200">Admin portal · Công việc</p>
            <h3 class="text-3xl font-semibold">Bảng phân công cho sếp</h3>
            <p class="text-sm text-slate-100">
              Tạo, phân công và theo dõi tiến độ công việc cho từng nhân sự.
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              class="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm"
              type="button"
              (click)="toggleCreateForm()"
            >
              {{ showCreateForm() ? 'Đóng form công việc' : 'Tạo công việc mới' }}
            </button>
          </div>
        </div>
      </div>

      @if (showCreateForm()) {
        <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="mb-4 flex items-center justify-between gap-3">
            <div>
              <h4 class="text-lg font-semibold text-slate-900">Tạo công việc mới</h4>
              <p class="text-sm text-slate-500">Nhập thông tin để thêm công việc vào bảng phân công</p>
            </div>
          </div>

          <form class="grid gap-4 md:grid-cols-2" [formGroup]="workForm" (ngSubmit)="createWork()">
            <label class="space-y-1 text-sm text-slate-700">
              <span>Tên công việc</span>
              <input class="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500" formControlName="taskName" />
            </label>
            <label class="space-y-1 text-sm text-slate-700">
              <span>Người được giao</span>
              <input class="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500" formControlName="assignee" />
            </label>
            <label class="space-y-1 text-sm text-slate-700 md:col-span-2">
              <span>Mô tả</span>
              <textarea class="min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500" formControlName="description"></textarea>
            </label>
            <label class="space-y-1 text-sm text-slate-700">
              <span>Giao lúc</span>
              <input type="datetime-local" class="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500" formControlName="assignedAt" />
            </label>
            <label class="space-y-1 text-sm text-slate-700">
              <span>Deadline</span>
              <input type="datetime-local" class="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500" formControlName="deadline" />
            </label>
            <label class="space-y-1 text-sm text-slate-700">
              <span>Ưu tiên</span>
              <select class="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500" formControlName="priority">
                <option value="Cao">Cao</option>
                <option value="Trung bình">Trung bình</option>
                <option value="Thấp">Thấp</option>
              </select>
            </label>
            <label class="space-y-1 text-sm text-slate-700">
              <span>Tiến độ</span>
              <input type="number" min="0" max="100" class="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500" formControlName="progress" />
            </label>
            <div class="flex items-end gap-3 md:col-span-2">
              <button class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700" type="submit">Thêm công việc</button>
              <button class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" type="button" (click)="resetForm()">Làm mới</button>
            </div>
          </form>
        </section>
      }

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p class="text-xs uppercase tracking-wide text-slate-500">Tổng công việc</p>
          <p class="mt-3 text-2xl font-semibold text-slate-900">{{ items().length }}</p>
          <p class="mt-1 text-sm text-slate-500">Các đầu việc đang theo dõi</p>
        </article>
        <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p class="text-xs uppercase tracking-wide text-slate-500">Đang xử lý</p>
          <p class="mt-3 text-2xl font-semibold text-slate-900">{{ inProgressCount() }}</p>
          <p class="mt-1 text-sm text-slate-500">Cần giám sát tiến độ</p>
        </article>
        <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p class="text-xs uppercase tracking-wide text-slate-500">Hoàn tất</p>
          <p class="mt-3 text-2xl font-semibold text-slate-900">{{ doneCount() }}</p>
          <p class="mt-1 text-sm text-slate-500">Đã xử lý xong</p>
        </article>
        <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p class="text-xs uppercase tracking-wide text-slate-500">Tiến độ TB</p>
          <p class="mt-3 text-2xl font-semibold text-slate-900">{{ avgProgress() }}%</p>
          <p class="mt-1 text-sm text-slate-500">Mức hoàn thành chung</p>
        </article>
      </div>

      <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="mb-4 flex items-center justify-between gap-3">
          <div>
            <h4 class="text-lg font-semibold text-slate-900">Bảng phân công công việc</h4>
            <p class="text-sm text-slate-500">Sếp có thể nhìn nhanh ai đang làm gì, hạn nào và tiến độ ra sao</p>
          </div>
        </div>

        <div class="overflow-x-auto rounded-xl border border-slate-200">
          <table class="min-w-[1100px] divide-y divide-slate-200 text-sm">
            <thead class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th class="px-4 py-3">Công việc</th>
                <th class="px-4 py-3">Người được giao</th>
                <th class="px-4 py-3">Giao lúc</th>
                <th class="px-4 py-3">Deadline</th>
                <th class="px-4 py-3">Ưu tiên</th>
                <th class="px-4 py-3">Trạng thái</th>
                <th class="px-4 py-3">Tiến độ</th>
                <th class="px-4 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              @for (task of items(); track task.id) {
                <tr class="hover:bg-slate-50">
                  <td class="px-4 py-3">
                    <div class="font-medium text-slate-900">{{ task.taskName }}</div>
                    <div class="text-xs text-slate-500">{{ task.description }}</div>
                  </td>
                  <td class="px-4 py-3 text-slate-700">{{ task.assignee }}</td>
                  <td class="px-4 py-3 text-slate-700 whitespace-nowrap">{{ task.assignedAt | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td class="px-4 py-3 text-slate-700 whitespace-nowrap">{{ task.deadline | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td class="px-4 py-3 text-slate-700 whitespace-nowrap">{{ task.priority }}</td>
                  <td class="px-4 py-3">
                    <span class="inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold leading-none" [class.bg-emerald-50]="task.status === 'Hoàn tất'" [class.text-emerald-700]="task.status === 'Hoàn tất'" [class.bg-amber-50]="task.status === 'Đang xử lý'" [class.text-amber-700]="task.status === 'Đang xử lý'" [class.bg-slate-100]="task.status === 'Mới'" [class.text-slate-700]="task.status === 'Mới'">
                      {{ task.status }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="w-40">
                      <div class="mb-1 flex justify-between text-xs text-slate-500">
                        <span>{{ task.progress }}%</span>
                      </div>
                      <div class="h-2 rounded-full bg-slate-100">
                        <div class="h-2 rounded-full bg-indigo-500" [style.width.%]="task.progress"></div>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <div class="flex justify-end gap-2">
                      <button
                        class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        type="button"
                        (click)="openEditTask(task.id)"
                      >
                        Sửa
                      </button>
                      <button
                        class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        type="button"
                        (click)="exportTaskPdf(task)"
                      >
                        Xuất PDF
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      @if (editingTask()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" (click)="closeEditTask()">
          <div class="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl" (click)="$event.stopPropagation()">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h4 class="text-xl font-semibold text-slate-900">Chỉnh sửa công việc</h4>
                <p class="text-sm text-slate-500">Cập nhật tiến độ và trạng thái công việc</p>
              </div>
              <button class="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600" type="button" (click)="closeEditTask()">Đóng</button>
            </div>

            <form class="mt-4 grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4" [formGroup]="editForm">
              <div class="grid gap-3 md:grid-cols-2">
                <div>
                  <label class="text-xs font-medium text-slate-600">Tên công việc</label>
                  <input class="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" formControlName="taskName" />
                </div>
                <div>
                  <label class="text-xs font-medium text-slate-600">Người được giao</label>
                  <input class="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" formControlName="assignee" />
                </div>
                <div>
                  <label class="text-xs font-medium text-slate-600">Ưu tiên</label>
                  <select class="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" formControlName="priority">
                    <option value="Cao">Cao</option>
                    <option value="Trung bình">Trung bình</option>
                    <option value="Thấp">Thấp</option>
                  </select>
                </div>
                <div>
                  <label class="text-xs font-medium text-slate-600">Trạng thái</label>
                  <select class="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" formControlName="status">
                    <option value="Mới">Mới</option>
                    <option value="Đang xử lý">Đang xử lý</option>
                    <option value="Hoàn tất">Hoàn tất</option>
                  </select>
                </div>
                <div>
                  <label class="text-xs font-medium text-slate-600">Tiến độ (%)</label>
                  <input type="number" min="0" max="100" class="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" formControlName="progress" />
                </div>
              </div>
              <div>
                <label class="text-xs font-medium text-slate-600">Mô tả</label>
                <textarea class="mt-1 min-h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" formControlName="description"></textarea>
              </div>

              <div class="flex justify-end gap-2">
                <button class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700" type="button" (click)="closeEditTask()">Huỷ</button>
                <button class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white" type="button" (click)="saveEditTask()">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkBoardComponent {
  private readonly fb = new FormBuilder();

  readonly showCreateForm = signal(false);
  readonly items = signal<WorkItem[]>([
    { id: '1', taskName: 'Chuẩn hoá quy trình onboarding', description: 'Hoàn thiện checklist và hướng dẫn cho nhân sự mới.', assignee: 'Nguyễn Minh Anh', assignedAt: '2026-04-16T09:00:00', deadline: '2026-04-22T17:00:00', progress: 75, priority: 'Cao', status: 'Đang xử lý' },
    { id: '2', taskName: 'Báo cáo doanh số tháng', description: 'Tổng hợp số liệu và gửi bản trình bày cho quản lý.', assignee: 'Trần Quốc Huy', assignedAt: '2026-04-15T14:30:00', deadline: '2026-04-20T12:00:00', progress: 55, priority: 'Cao', status: 'Đang xử lý' },
    { id: '3', taskName: 'Đối soát công nợ', description: 'Kiểm tra chứng từ và cập nhật trạng thái công nợ.', assignee: 'Lê Thảo Vy', assignedAt: '2026-04-14T10:00:00', deadline: '2026-04-19T18:00:00', progress: 90, priority: 'Trung bình', status: 'Hoàn tất' },
    { id: '4', taskName: 'Cập nhật dashboard vận hành', description: 'Theo dõi tiến độ xử lý công việc theo tuần.', assignee: 'Phạm Gia Bảo', assignedAt: '2026-04-17T08:30:00', deadline: '2026-04-25T17:30:00', progress: 68, priority: 'Trung bình', status: 'Đang xử lý' }
  ]);

  readonly workForm = this.fb.nonNullable.group({
    taskName: ['', Validators.required],
    description: ['', Validators.required],
    assignee: ['', Validators.required],
    assignedAt: ['', Validators.required],
    deadline: ['', Validators.required],
    priority: ['Trung bình' as WorkItem['priority'], Validators.required],
    progress: [0, [Validators.required, Validators.min(0), Validators.max(100)]]
  });

  readonly editForm = this.fb.nonNullable.group({
    taskName: ['', Validators.required],
    description: ['', Validators.required],
    assignee: ['', Validators.required],
    priority: ['Trung bình' as WorkItem['priority'], Validators.required],
    status: ['Mới' as WorkItem['status'], Validators.required],
    progress: [0, [Validators.required, Validators.min(0), Validators.max(100)]]
  });

  readonly inProgressCount = computed(() => this.items().filter((item) => item.status === 'Đang xử lý').length);
  readonly doneCount = computed(() => this.items().filter((item) => item.status === 'Hoàn tất').length);
  readonly editingTask = signal<WorkItem | null>(null);
  readonly avgProgress = computed(() => {
    const items = this.items();
    if (items.length === 0) return 0;
    return Math.round(items.reduce((sum, item) => sum + item.progress, 0) / items.length);
  });

  toggleCreateForm(): void {
    this.showCreateForm.set(!this.showCreateForm());
  }

  openEditTask(taskId: string): void {
    const task = this.items().find((item) => item.id === taskId);
    if (!task) return;
    this.editingTask.set(task);
    this.editForm.reset({
      taskName: task.taskName,
      description: task.description,
      assignee: task.assignee,
      priority: task.priority,
      status: task.status,
      progress: task.progress
    });
  }

  closeEditTask(): void {
    this.editingTask.set(null);
  }

  saveEditTask(): void {
    const current = this.editingTask();
    if (!current || this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const value = this.editForm.getRawValue();
    const progress = Math.max(0, Math.min(100, Number(value.progress ?? 0)));
    const status = value.status === 'Hoàn tất' || progress >= 100 ? 'Hoàn tất' : value.status === 'Đang xử lý' || progress > 0 ? 'Đang xử lý' : 'Mới';

    this.items.update((tasks) =>
      tasks.map((task) =>
        task.id === current.id
          ? {
              ...task,
              taskName: value.taskName,
              description: value.description,
              assignee: value.assignee,
              priority: value.priority,
              progress,
              status
            }
          : task
      )
    );

    this.closeEditTask();
  }

  resetForm(): void {
    this.workForm.reset({
      taskName: '',
      description: '',
      assignee: '',
      assignedAt: '',
      deadline: '',
      priority: 'Trung bình',
      progress: 0
    });
  }

  createWork(): void {
    if (this.workForm.invalid) {
      this.workForm.markAllAsTouched();
      return;
    }

    const value = this.workForm.getRawValue();
    const progress = Math.max(0, Math.min(100, Number(value.progress ?? 0)));
    this.items.update((tasks) => [
      {
        id: crypto.randomUUID(),
        taskName: value.taskName,
        description: value.description,
        assignee: value.assignee,
        assignedAt: value.assignedAt,
        deadline: value.deadline,
        progress,
        priority: value.priority,
        status: progress >= 100 ? 'Hoàn tất' : progress > 0 ? 'Đang xử lý' : 'Mới'
      },
      ...tasks
    ]);
    this.workForm.reset({
      taskName: '',
      description: '',
      assignee: '',
      assignedAt: '',
      deadline: '',
      priority: 'Trung bình',
      progress: 0
    });
    this.showCreateForm.set(false);
  }

  exportTaskPdf(task: WorkItem): void {
    const html = `
      <html>
        <head>
          <title>Chi tiết công việc</title>
          <style>
            @page { size: A4; margin: 18mm; }
            html, body { margin: 0; padding: 0; }
            body { font-family: Arial, sans-serif; color: #111827; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .page { border: 1px solid #e5e7eb; padding: 18mm 16mm; box-sizing: border-box; }
            .header { text-align: center; font-weight: 700; font-size: 18px; text-transform: uppercase; }
            .sub { text-align: center; color: #4b5563; margin-top: 6px; }
            .section { margin-top: 18px; }
            .row { display: grid; grid-template-columns: 180px 1fr; gap: 16px; margin-bottom: 12px; }
            .label { font-weight: 700; }
            .value { border-bottom: 1px dotted #9ca3af; min-height: 22px; padding-bottom: 2px; }
            .progress-wrap { margin-top: 6px; }
            .bar { height: 10px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
            .bar > div { height: 10px; background: #4f46e5; width: ${task.progress}%; }
            .footer { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin-top: 52px; }
            .sign { text-align: center; }
            .sign-line { margin-top: 72px; border-top: 1px dashed #6b7280; padding-top: 6px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="header">Phiếu chi tiết công việc</div>
            <div class="sub">Mã công việc: ${task.id}</div>
            <div class="section">
              <div class="row"><div class="label">Công việc</div><div class="value">${task.taskName}</div></div>
              <div class="row"><div class="label">Người được giao</div><div class="value">${task.assignee}</div></div>
              <div class="row"><div class="label">Mô tả</div><div class="value">${task.description}</div></div>
              <div class="row"><div class="label">Giao lúc</div><div class="value">${task.assignedAt}</div></div>
              <div class="row"><div class="label">Deadline</div><div class="value">${task.deadline}</div></div>
              <div class="row"><div class="label">Ưu tiên</div><div class="value">${task.priority}</div></div>
              <div class="row"><div class="label">Trạng thái</div><div class="value">${task.status}</div></div>
              <div class="row">
                <div class="label">Tiến độ</div>
                <div class="progress-wrap">
                  <div>${task.progress}%</div>
                  <div class="bar"><div></div></div>
                </div>
              </div>
            </div>
            <div class="footer">
              <div class="sign">
                <div><strong>Người giao việc</strong></div>
                <div class="sign-line">Ký, ghi rõ họ tên</div>
              </div>
              <div class="sign">
                <div><strong>Người nhận việc</strong></div>
                <div class="sign-line">Ký, ghi rõ họ tên</div>
              </div>
            </div>
          </div>
          <script>
            window.onload = () => {
              window.print();
              window.onafterprint = () => window.close();
            };
          </script>
        </body>
      </html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank', 'width=900,height=700');
    if (!win) {
      URL.revokeObjectURL(url);
      return;
    }
    win.addEventListener('beforeunload', () => URL.revokeObjectURL(url));
  }
}
