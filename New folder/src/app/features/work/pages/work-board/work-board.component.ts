import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../../../../environments/environment';

interface WorkTask {
  id: string;
  title: string;
  assigneeId: string | null;
  assigneeName: string | null;
  dueDate: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
  createdAt: string;
}

@Component({
  selector: 'app-work-board',
  standalone: true,
  imports: [AsyncPipe, DatePipe],
  template: `
    <div class="space-y-6">
      <div class="rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-700 p-6 text-white shadow-sm">
        <h3 class="text-3xl font-semibold">Bảng công việc</h3>
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
                <tr><th class="px-4 py-3">Công việc</th><th class="px-4 py-3">Assignee</th><th class="px-4 py-3">Hạn</th><th class="px-4 py-3">Ưu tiên</th><th class="px-4 py-3">Trạng thái</th></tr>
              </thead>
              <tbody class="divide-y divide-slate-100 bg-white">
                @for (task of vm.rows; track task.id) {
                  <tr class="hover:bg-slate-50">
                    <td class="px-4 py-3 font-medium text-slate-900">{{ task.title }}</td>
                    <td class="px-4 py-3 text-slate-700">{{ task.assigneeName || '—' }}</td>
                    <td class="px-4 py-3 text-slate-700">{{ task.dueDate || '—' }}</td>
                    <td class="px-4 py-3 text-slate-700">{{ task.priority }}</td>
                    <td class="px-4 py-3 text-slate-700">{{ task.status }}</td>
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
export class WorkBoardComponent {
  private readonly http = inject(HttpClient);

  readonly vm$ = this.http.get<WorkTask[]>(`${environment.apiBaseUrl}/work/tasks`).pipe(
    map((rows) => ({
      rows,
      total: rows.length,
      inProgress: rows.filter((x) => x.status === 'in_progress').length,
      review: rows.filter((x) => x.status === 'review').length,
      done: rows.filter((x) => x.status === 'done').length
    }))
  );
}
