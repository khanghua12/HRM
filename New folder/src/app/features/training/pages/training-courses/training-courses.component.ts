import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { TrainingCourse } from '../../../../models/training.model';

@Component({
  selector: 'app-training-courses',
  standalone: true,
  template: `
    <div class="space-y-6">
      <div class="flex items-start justify-between">
        <div>
          <h3 class="text-2xl font-semibold">Khóa đào tạo</h3>
          <p class="mt-1 text-sm text-slate-500">Lộ trình nâng cao năng lực và chương trình học nội bộ.</p>
        </div>
        <button class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white">
          + Khóa học mới
        </button>
      </div>

      <div class="grid gap-4 md:grid-cols-3">
        <article class="rounded-xl border border-slate-200 bg-white p-4">
          <p class="text-xs uppercase text-slate-500">Tổng khóa</p>
          <p class="mt-2 text-2xl font-bold">{{ courses().length }}</p>
        </article>
        <article class="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p class="text-xs uppercase text-blue-700">Đang diễn ra</p>
          <p class="mt-2 text-2xl font-bold text-blue-700">{{ ongoingCount() }}</p>
        </article>
        <article class="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p class="text-xs uppercase text-emerald-700">Đã hoàn thành</p>
          <p class="mt-2 text-2xl font-bold text-emerald-700">{{ completedCount() }}</p>
        </article>
      </div>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        @for (course of courses(); track course.id) {
          <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h4 class="font-semibold">{{ course.title }}</h4>
            <p class="mt-1 text-sm text-slate-500">{{ course.trainer }}</p>
            <p class="mt-3 text-xs text-slate-500">{{ course.startDate }} – {{ course.endDate }}</p>
            <span class="mt-3 inline-block rounded-full bg-slate-100 px-2 py-1 text-xs">
              {{ statusLabel(course.status) }}
            </span>
          </article>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrainingCoursesComponent {
  readonly courses = signal<TrainingCourse[]>([
    {
      id: 'T1',
      code: 'TR-001',
      title: 'Nền tảng lãnh đạo',
      trainer: 'Ban huấn luyện nội bộ',
      startDate: '20/04/2026',
      endDate: '22/04/2026',
      status: 'upcoming'
    },
    {
      id: 'T2',
      code: 'TR-002',
      title: 'Kiến trúc Angular nâng cao',
      trainer: 'Guild Kỹ thuật',
      startDate: '10/04/2026',
      endDate: '18/04/2026',
      status: 'ongoing'
    },
    {
      id: 'T3',
      code: 'TR-003',
      title: 'Chính sách nhân sự & tuân thủ',
      trainer: 'Phòng Pháp chế',
      startDate: '01/03/2026',
      endDate: '15/03/2026',
      status: 'completed'
    }
  ]);

  readonly ongoingCount = computed(() => this.courses().filter((course) => course.status === 'ongoing').length);
  readonly completedCount = computed(() => this.courses().filter((course) => course.status === 'completed').length);

  statusLabel(status: TrainingCourse['status']): string {
    const map: Record<TrainingCourse['status'], string> = {
      upcoming: 'Sắp diễn ra',
      ongoing: 'Đang diễn ra',
      completed: 'Hoàn thành'
    };
    return map[status] ?? status;
  }
}
