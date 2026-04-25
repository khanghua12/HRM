import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, finalize, map, startWith, switchMap, tap } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';

interface WorkTask {
  id: string;
  title: string;
  assigneeId: string | null;
  assigneeName: string | null;
  dueDate: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
  progress?: number | null;
  receiverName?: string | null;
  assignerName?: string | null;
  createdAt: string;
}

interface TaskForm {
  title: string;
  assigneeName: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
  progress: number;
  receiverName: string;
  assignerName: string;
}

@Component({
  selector: 'app-work-board',
  standalone: true,
  imports: [AsyncPipe, DatePipe, FormsModule, ModalComponent],
  template: `
    <div class="space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-700 p-6 text-white shadow-sm">
        <h3 class="text-3xl font-semibold">Bảng công việc</h3>
        <button
          type="button"
          (click)="openCreateDialog()"
          class="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
        >
          + Tạo công việc
        </button>
      </div>

      @if (vm$ | async; as vm) {
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p class="text-xs uppercase text-slate-500">Tổng công việc</p><p class="mt-3 text-2xl font-semibold text-slate-900">{{ vm.total }}</p></article>
          <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p class="text-xs uppercase text-slate-500">Đang xử lý</p><p class="mt-3 text-2xl font-semibold text-slate-900">{{ vm.inProgress }}</p></article>
          <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p class="text-xs uppercase text-slate-500">Review</p><p class="mt-3 text-2xl font-semibold text-slate-900">{{ vm.review }}</p></article>
          <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p class="text-xs uppercase text-slate-500">Hoàn tất</p><p class="mt-3 text-2xl font-semibold text-slate-900">{{ vm.done }}</p></article>
        </div>

        <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="overflow-x-auto rounded-xl border border-slate-200">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
              <thead class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th class="px-4 py-3">Công việc</th>
                  <th class="px-4 py-3">Assignee</th>
                  <th class="px-4 py-3">Hạn</th>
                  <th class="px-4 py-3">Ưu tiên</th>
                  <th class="px-4 py-3">Trạng thái</th>
                  <th class="px-4 py-3">Tiến độ</th>
                  <th class="px-4 py-3">Người nhận</th>
                  <th class="px-4 py-3">Người giao</th>
                  <th class="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 bg-white">
                @for (task of vm.rows; track task.id) {
                  <tr class="hover:bg-slate-50">
                    <td class="px-4 py-3 font-medium text-slate-900">{{ task.title }}</td>
                    <td class="px-4 py-3 text-slate-700">{{ task.assigneeName || '—' }}</td>
                    <td class="px-4 py-3 text-slate-700">{{ task.dueDate || '—' }}</td>
                    <td class="px-4 py-3 text-slate-700">{{ task.priority }}</td>
                    <td class="px-4 py-3 text-slate-700">{{ task.status }}</td>
                    <td class="px-4 py-3 text-slate-700">{{ task.progress ?? 0 }}%</td>
                    <td class="px-4 py-3 text-slate-700">{{ task.receiverName || '—' }}</td>
                    <td class="px-4 py-3 text-slate-700">{{ task.assignerName || '—' }}</td>
                    <td class="px-4 py-3">
                      <button
                        type="button"
                        (click)="openEditDialog(task)"
                        class="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Xem
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      }

      @if (isCreateDialogOpen) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <app-modal class="block w-full max-w-3xl shadow-2xl">
            <div class="mb-5 flex items-center justify-between">
              <h4 class="text-xl font-semibold text-slate-900">Tạo công việc</h4>
              <button type="button" (click)="closeCreateDialog()" class="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100">✕</button>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <label class="block text-sm">
                <span class="mb-1 block font-medium text-slate-600">Công việc</span>
                <input [(ngModel)]="createForm.title" class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none" placeholder="Nhập tên công việc" />
              </label>

              <label class="block text-sm">
                <span class="mb-1 block font-medium text-slate-600">Assignee</span>
                <input [(ngModel)]="createForm.assigneeName" class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none" placeholder="Tên assignee" />
              </label>

              <label class="block text-sm">
                <span class="mb-1 block font-medium text-slate-600">Hạn</span>
                <input type="date" [(ngModel)]="createForm.dueDate" class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none" />
              </label>

              <label class="block text-sm">
                <span class="mb-1 block font-medium text-slate-600">Ưu tiên</span>
                <select [(ngModel)]="createForm.priority" class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none">
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                  <option value="urgent">urgent</option>
                </select>
              </label>

              <label class="block text-sm">
                <span class="mb-1 block font-medium text-slate-600">Trạng thái</span>
                <select [(ngModel)]="createForm.status" class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none">
                  <option value="todo">todo</option>
                  <option value="in_progress">in_progress</option>
                  <option value="review">review</option>
                  <option value="done">done</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </label>

              <label class="block text-sm">
                <span class="mb-1 block font-medium text-slate-600">Tiến độ (%)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  [(ngModel)]="createForm.progress"
                  class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                />
              </label>

              <label class="block text-sm">
                <span class="mb-1 block font-medium text-slate-600">Người nhận</span>
                <input [(ngModel)]="createForm.receiverName" class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none" placeholder="Tên người nhận" />
              </label>

              <label class="block text-sm">
                <span class="mb-1 block font-medium text-slate-600">Người giao</span>
                <input [(ngModel)]="createForm.assignerName" class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none" placeholder="Tên người giao" />
              </label>
            </div>

            <div class="mt-6 flex justify-end gap-3">
              <button type="button" (click)="closeCreateDialog()" class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Hủy</button>
              <button type="button" (click)="createTask()" [disabled]="isCreatingTask" class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">{{ isCreatingTask ? 'Đang tạo...' : 'Tạo công việc' }}</button>
            </div>
          </app-modal>
        </div>
      }

      @if (isEditDialogOpen) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <app-modal class="block w-full max-w-3xl shadow-2xl">
            <div class="mb-5 flex items-center justify-between">
              <h4 class="text-xl font-semibold text-slate-900">Chi tiết công việc</h4>
              <button type="button" (click)="closeEditDialog()" class="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100">✕</button>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <label class="block text-sm">
                <span class="mb-1 block font-medium text-slate-600">Công việc</span>
                <input [(ngModel)]="editForm.title" class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none" />
              </label>

              <label class="block text-sm">
                <span class="mb-1 block font-medium text-slate-600">Assignee</span>
                <input [(ngModel)]="editForm.assigneeName" class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none" />
              </label>

              <label class="block text-sm">
                <span class="mb-1 block font-medium text-slate-600">Hạn</span>
                <input type="date" [(ngModel)]="editForm.dueDate" class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none" />
              </label>

              <label class="block text-sm">
                <span class="mb-1 block font-medium text-slate-600">Ưu tiên</span>
                <select [(ngModel)]="editForm.priority" class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none">
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                  <option value="urgent">urgent</option>
                </select>
              </label>

              <label class="block text-sm">
                <span class="mb-1 block font-medium text-slate-600">Trạng thái</span>
                <select [(ngModel)]="editForm.status" class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none">
                  <option value="todo">todo</option>
                  <option value="in_progress">in_progress</option>
                  <option value="review">review</option>
                  <option value="done">done</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </label>

              <label class="block text-sm">
                <span class="mb-1 block font-medium text-slate-600">Tiến độ (%)</span>
                <input type="number" min="0" max="100" [(ngModel)]="editForm.progress" class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none" />
              </label>

              <label class="block text-sm">
                <span class="mb-1 block font-medium text-slate-600">Người nhận</span>
                <input [(ngModel)]="editForm.receiverName" class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none" />
              </label>

              <label class="block text-sm">
                <span class="mb-1 block font-medium text-slate-600">Người giao</span>
                <input [(ngModel)]="editForm.assignerName" class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none" />
              </label>
            </div>

            <div class="mt-6 flex justify-end gap-3">
              <button type="button" (click)="closeEditDialog()" class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Đóng</button>
              <button type="button" (click)="updateTask()" [disabled]="isUpdatingTask" class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">{{ isUpdatingTask ? 'Đang lưu...' : 'Lưu cập nhật' }}</button>
            </div>
          </app-modal>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkBoardComponent {
  private readonly http = inject(HttpClient);
  private readonly reload$ = new Subject<void>();

  isCreateDialogOpen = false;
  isEditDialogOpen = false;
  isCreatingTask = false;
  isUpdatingTask = false;
  editingTaskId: string | null = null;

  createForm: TaskForm = this.getDefaultForm();
  editForm: TaskForm = this.getDefaultForm();

  readonly vm$ = this.reload$.pipe(
    startWith(void 0),
    switchMap(() => this.http.get<WorkTask[]>(`${environment.apiBaseUrl}/work/tasks`)),
    map((rows) => ({
      rows,
      total: rows.length,
      inProgress: rows.filter((x) => x.status === 'in_progress').length,
      review: rows.filter((x) => x.status === 'review').length,
      done: rows.filter((x) => x.status === 'done').length
    }))
  );

  openCreateDialog(): void {
    this.createForm = this.getDefaultForm();
    this.isCreateDialogOpen = true;
  }

  closeCreateDialog(): void {
    this.isCreateDialogOpen = false;
  }

  createTask(): void {
    if (!this.createForm.title.trim() || this.isCreatingTask) {
      return;
    }

    this.isCreatingTask = true;

    this.http
      .post(`${environment.apiBaseUrl}/work/tasks`, this.toTaskPayload(this.createForm))
      .pipe(
        tap(() => {
          this.reload$.next();
          this.closeCreateDialog();
          this.createForm = this.getDefaultForm();
        }),
        finalize(() => {
          this.isCreatingTask = false;
        })
      )
      .subscribe();
  }

  openEditDialog(task: WorkTask): void {
    this.editingTaskId = task.id;
    this.editForm = {
      title: task.title ?? '',
      assigneeName: task.assigneeName ?? '',
      dueDate: this.toDateInputValue(task.dueDate),
      priority: task.priority,
      status: task.status,
      progress: Math.max(0, Math.min(100, Number(task.progress) || 0)),
      receiverName: task.receiverName ?? '',
      assignerName: task.assignerName ?? ''
    };
    this.isEditDialogOpen = true;
  }

  closeEditDialog(): void {
    this.isEditDialogOpen = false;
    this.editingTaskId = null;
    this.isUpdatingTask = false;
    this.editForm = this.getDefaultForm();
  }

  updateTask(): void {
    if (!this.editingTaskId || !this.editForm.title.trim() || this.isUpdatingTask) {
      return;
    }

    this.isUpdatingTask = true;

    this.http
      .patch(`${environment.apiBaseUrl}/work/tasks/${this.editingTaskId}`, this.toTaskPayload(this.editForm))
      .pipe(
        tap(() => {
          this.reload$.next();
          this.closeEditDialog();
        }),
        finalize(() => {
          this.isUpdatingTask = false;
        })
      )
      .subscribe();
  }

  private toDateInputValue(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    const normalized = String(value);
    return normalized.length >= 10 ? normalized.slice(0, 10) : normalized;
  }

  private toTaskPayload(form: TaskForm) {
    return {
      title: form.title.trim(),
      assigneeName: form.assigneeName.trim() || null,
      dueDate: form.dueDate || null,
      priority: form.priority,
      status: form.status,
      progress: Math.max(0, Math.min(100, Number(form.progress) || 0)),
      receiverName: form.receiverName.trim() || null,
      assignerName: form.assignerName.trim() || null
    };
  }

  private getDefaultForm(): TaskForm {
    return {
      title: '',
      assigneeName: '',
      dueDate: '',
      priority: 'medium',
      status: 'todo',
      progress: 0,
      receiverName: '',
      assignerName: ''
    };
  }
}
