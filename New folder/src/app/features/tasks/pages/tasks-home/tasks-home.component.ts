import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

type TaskStatus = 'To do' | 'Doing' | 'Done';
type TaskPriority = 'Low' | 'Medium' | 'High';

interface TaskItem {
  id: string;
  title: string;
  description: string;
  assignee: string;
  assignedAt: string;
  deadline: string;
  status: TaskStatus;
  priority: TaskPriority;
}

interface CreateTaskForm {
  title: string;
  description: string;
  assignee: string;
  deadline: string;
  priority: TaskPriority;
}

@Component({
  selector: 'app-tasks-home',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-6">
      @if (isDetailView()) {
        <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <button
            type="button"
            class="mb-5 inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            (click)="goBackToList()"
          >
            ← Quay lại danh sách
          </button>

          @if (selectedTask(); as task) {
            <div class="space-y-4">
              <div>
                <h3 class="text-2xl font-semibold text-slate-900">{{ task.title }}</h3>
                <p class="mt-1 text-sm text-slate-500">Mã công việc: {{ task.id }}</p>
              </div>

              <article class="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                {{ task.description || 'Không có mô tả.' }}
              </article>

              <div class="grid gap-4 md:grid-cols-2">
                <div class="rounded-xl border border-slate-200 bg-white p-4">
                  <p class="text-xs uppercase text-slate-500">Người được giao</p>
                  <p class="mt-1 text-sm font-medium text-slate-800">{{ task.assignee }}</p>
                </div>
                <div class="rounded-xl border border-slate-200 bg-white p-4">
                  <p class="text-xs uppercase text-slate-500">Deadline</p>
                  <p class="mt-1 text-sm font-medium text-slate-800">{{ task.deadline || 'Chưa đặt' }}</p>
                </div>
                <div class="rounded-xl border border-slate-200 bg-white p-4">
                  <p class="text-xs uppercase text-slate-500">Trạng thái</p>
                  <p class="mt-1 text-sm font-medium text-slate-800">{{ task.status }}</p>
                </div>
                <div class="rounded-xl border border-slate-200 bg-white p-4">
                  <p class="text-xs uppercase text-slate-500">Priority</p>
                  <p class="mt-1 text-sm font-medium text-slate-800">{{ task.priority }}</p>
                </div>
              </div>
            </div>
          } @else {
            <p class="text-sm text-rose-600">Không tìm thấy công việc.</p>
          }
        </section>
      } @else {
        <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div class="mb-6">
            <h3 class="text-2xl font-semibold text-slate-900">Công việc</h3>
            <p class="mt-1 text-sm text-slate-500">Quản lý công việc cơ bản cho công ty nhỏ.</p>
          </div>

          <form class="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2" (ngSubmit)="createTask()">
            <div class="md:col-span-2">
              <label class="mb-1 block text-sm font-medium text-slate-700">Tên công việc *</label>
              <input
                type="text"
                name="title"
                [(ngModel)]="form.title"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-500 transition focus:ring"
                placeholder="Nhập tên công việc"
                required
              />
            </div>

            <div class="md:col-span-2">
              <label class="mb-1 block text-sm font-medium text-slate-700">Mô tả</label>
              <textarea
                name="description"
                [(ngModel)]="form.description"
                rows="3"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-500 transition focus:ring"
                placeholder="Mô tả ngắn"
              ></textarea>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Người được giao</label>
              <select
                name="assignee"
                [(ngModel)]="form.assignee"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-500 transition focus:ring"
              >
                @for (assignee of assignees; track assignee) {
                  <option [value]="assignee">{{ assignee }}</option>
                }
              </select>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Deadline</label>
              <input
                type="date"
                name="deadline"
                [(ngModel)]="form.deadline"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-500 transition focus:ring"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Priority</label>
              <select
                name="priority"
                [(ngModel)]="form.priority"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-500 transition focus:ring"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div class="flex items-end">
              <button
                type="submit"
                class="inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                [disabled]="!form.title.trim()"
              >
                Tạo công việc
              </button>
            </div>
          </form>
        </section>

        <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200">
              <thead class="bg-slate-50">
                <tr class="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th class="px-4 py-3">Tên công việc</th>
                  <th class="px-4 py-3">Người được giao</th>
                  <th class="px-4 py-3">Ngày giờ giao</th>
                  <th class="px-4 py-3">Deadline</th>
                  <th class="px-4 py-3">Trạng thái</th>
                  <th class="px-4 py-3">Priority</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 bg-white">
                @for (task of tasks(); track task.id) {
                  <tr
                    class="cursor-pointer transition hover:bg-indigo-50/60"
                    (click)="goToDetail(task.id)"
                  >
                    <td class="px-4 py-4 text-sm font-medium text-slate-900">{{ task.title }}</td>
                    <td class="px-4 py-4 text-sm text-slate-600">{{ task.assignee }}</td>
                    <td class="px-4 py-4 text-sm text-slate-600">{{ task.assignedAt }}</td>
                    <td class="px-4 py-4 text-sm text-slate-600">{{ task.deadline || 'Chưa đặt' }}</td>
                    <td class="px-4 py-4 text-sm" (click)="$event.stopPropagation()">
                      <button
                        type="button"
                        class="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                        (click)="nextStatus(task.id)"
                      >
                        {{ task.status }}
                      </button>
                    </td>
                    <td class="px-4 py-4 text-sm text-slate-600">{{ task.priority }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TasksHomeComponent implements OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly routeSub: Subscription;

  readonly assignees: string[] = ['Nguyễn Minh Anh', 'Trần Quốc Bảo', 'Lê Thu Hà', 'Phạm Gia Huy'];

  readonly taskId = signal<string | null>(null);
  readonly tasks = signal<TaskItem[]>([
    {
      id: 'task-001',
      title: 'Chuẩn bị hợp đồng thử việc',
      description: 'Chuẩn hóa hợp đồng và gửi lại cho ứng viên mới.',
      assignee: 'Nguyễn Minh Anh',
      assignedAt: '2026-04-16 09:00',
      deadline: '2026-04-20',
      status: 'To do',
      priority: 'High'
    },
    {
      id: 'task-002',
      title: 'Cập nhật bảng chấm công tháng 04',
      description: 'Đối soát dữ liệu chấm công giữa HR và quản lý bộ phận.',
      assignee: 'Lê Thu Hà',
      assignedAt: '2026-04-16 14:00',
      deadline: '2026-04-25',
      status: 'Doing',
      priority: 'Medium'
    },
    {
      id: 'task-003',
      title: 'Tổng hợp KPI quý',
      description: 'Thu thập KPI và hoàn thiện báo cáo quý cho ban lãnh đạo.',
      assignee: 'Trần Quốc Bảo',
      assignedAt: '2026-04-17 08:30',
      deadline: '2026-04-28',
      status: 'Done',
      priority: 'Low'
    }
  ]);

  readonly isDetailView = computed(() => this.taskId() !== null);
  readonly selectedTask = computed(() => {
    const id = this.taskId();
    if (!id) {
      return null;
    }
    return this.tasks().find((task) => task.id === id) ?? null;
  });

  readonly form: CreateTaskForm = {
    title: '',
    description: '',
    assignee: this.assignees[0],
    deadline: '',
    priority: 'Medium'
  };

  constructor() {
    this.routeSub = this.route.paramMap.subscribe((params) => {
      this.taskId.set(params.get('id'));
    });
  }

  ngOnDestroy(): void {
    this.routeSub.unsubscribe();
  }

  createTask(): void {
    const title = this.form.title.trim();
    if (!title) {
      return;
    }

    const id = `task-${String(this.tasks().length + 1).padStart(3, '0')}`;
    const now = new Date();
    const assignedAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newTask: TaskItem = {
      id,
      title,
      description: this.form.description.trim(),
      assignee: this.form.assignee,
      assignedAt,
      deadline: this.form.deadline,
      status: 'To do',
      priority: this.form.priority
    };

    this.tasks.set([newTask, ...this.tasks()]);

    this.form.title = '';
    this.form.description = '';
    this.form.assignee = this.assignees[0];
    this.form.deadline = '';
    this.form.priority = 'Medium';
  }

  goToDetail(id: string): void {
    void this.router.navigate(['/tasks', id]);
  }

  goBackToList(): void {
    void this.router.navigate(['/tasks']);
  }

  nextStatus(id: string): void {
    this.tasks.update((tasks) =>
      tasks.map((task) => {
        if (task.id !== id) {
          return task;
        }

        const nextStatus: TaskStatus =
          task.status === 'To do' ? 'Doing' : task.status === 'Doing' ? 'Done' : 'Done';

        return {
          ...task,
          status: nextStatus
        };
      })
    );
  }
}
