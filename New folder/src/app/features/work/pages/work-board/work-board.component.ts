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
          <button
            class="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm"
            type="button"
            (click)="toggleCreateForm()"
          >
            {{ showCreateForm() ? 'Đóng form công việc' : 'Tạo công việc mới' }}
          </button>
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

        <div class="overflow-hidden rounded-xl border border-slate-200">
          <table class="min-w-full divide-y divide-slate-200 text-sm">
            <thead class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th class="px-4 py-3">Công việc</th>
                <th class="px-4 py-3">Người được giao</th>
                <th class="px-4 py-3">Giao lúc</th>
                <th class="px-4 py-3">Deadline</th>
                <th class="px-4 py-3">Ưu tiên</th>
                <th class="px-4 py-3">Trạng thái</th>
                <th class="px-4 py-3">Tiến độ</th>
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
                  <td class="px-4 py-3 text-slate-700">{{ task.assignedAt | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td class="px-4 py-3 text-slate-700">{{ task.deadline | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td class="px-4 py-3 text-slate-700">{{ task.priority }}</td>
                  <td class="px-4 py-3">
                    <span class="rounded-full px-3 py-1 text-xs font-semibold" [class.bg-emerald-50]="task.status === 'Hoàn tất'" [class.text-emerald-700]="task.status === 'Hoàn tất'" [class.bg-amber-50]="task.status === 'Đang xử lý'" [class.text-amber-700]="task.status === 'Đang xử lý'" [class.bg-slate-100]="task.status === 'Mới'" [class.text-slate-700]="task.status === 'Mới'">
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
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
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

  readonly inProgressCount = computed(() => this.items().filter((item) => item.status === 'Đang xử lý').length);
  readonly doneCount = computed(() => this.items().filter((item) => item.status === 'Hoàn tất').length);
  readonly avgProgress = computed(() => Math.round(this.items().reduce((sum, item) => sum + item.progress, 0) / this.items().length));

  toggleCreateForm(): void {
    this.showCreateForm.set(!this.showCreateForm());
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
}
