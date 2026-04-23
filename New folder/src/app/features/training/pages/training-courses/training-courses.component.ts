import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../../../../environments/environment';

interface TrainingRow {
  id: string;
  code: string;
  name: string;
  category: string;
  startDate: string;
  endDate: string;
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled';
}

@Component({
  selector: 'app-training-courses',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    <div class="space-y-6">
      <div class="flex items-start justify-between">
        <div>
          <h3 class="text-2xl font-semibold">Khóa đào tạo</h3>
          <p class="mt-1 text-sm text-slate-500">Lộ trình nâng cao năng lực và chương trình học nội bộ.</p>
        </div>
      </div>

      @if (vm$ | async; as vm) {
        <div class="grid gap-4 md:grid-cols-3">
          <article class="rounded-xl border border-slate-200 bg-white p-4">
            <p class="text-xs uppercase text-slate-500">Tổng khóa</p>
            <p class="mt-2 text-2xl font-bold">{{ vm.rows.length }}</p>
          </article>
          <article class="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p class="text-xs uppercase text-blue-700">Đang diễn ra</p>
            <p class="mt-2 text-2xl font-bold text-blue-700">{{ vm.ongoing }}</p>
          </article>
          <article class="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p class="text-xs uppercase text-emerald-700">Đã hoàn thành</p>
            <p class="mt-2 text-2xl font-bold text-emerald-700">{{ vm.completed }}</p>
          </article>
        </div>

        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          @for (course of vm.rows; track course.id) {
            <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h4 class="font-semibold">{{ course.name }}</h4>
              <p class="mt-1 text-sm text-slate-500">{{ course.category || 'internal' }}</p>
              <p class="mt-3 text-xs text-slate-500">{{ course.startDate }} – {{ course.endDate }}</p>
              <span class="mt-3 inline-block rounded-full bg-slate-100 px-2 py-1 text-xs">{{ statusLabel(course.status) }}</span>
            </article>
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrainingCoursesComponent {
  private readonly http = inject(HttpClient);

  readonly vm$ = this.http.get<TrainingRow[]>(`${environment.apiBaseUrl}/training/courses`).pipe(
    map((rows) => ({
      rows,
      ongoing: rows.filter((x) => x.status === 'ongoing').length,
      completed: rows.filter((x) => x.status === 'completed').length
    }))
  );

  statusLabel(status: TrainingRow['status']): string {
    const m: Record<TrainingRow['status'], string> = {
      planned: 'Kế hoạch',
      ongoing: 'Đang diễn ra',
      completed: 'Hoàn thành',
      cancelled: 'Đã huỷ'
    };
    return m[status] ?? status;
  }
}
