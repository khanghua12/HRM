import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { Candidate, CandidateStage } from '../../../../models/recruitment.model';

@Component({
  selector: 'app-recruitment-board',
  standalone: true,
  template: `
    <div class="space-y-6">
      <div class="flex items-start justify-between">
        <div>
          <h3 class="text-2xl font-semibold">Theo dõi ứng viên</h3>
          <p class="mt-1 text-sm text-slate-500">Kanban các giai đoạn tuyển dụng.</p>
        </div>
        <button class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white">
          + Ứng viên mới
        </button>
      </div>

      <div class="grid gap-4 md:grid-cols-3">
        <article class="rounded-xl border border-slate-200 bg-white p-4">
          <p class="text-xs uppercase text-slate-500">Vị trí đang mở</p>
          <p class="mt-2 text-2xl font-bold">8</p>
        </article>
        <article class="rounded-xl border border-slate-200 bg-white p-4">
          <p class="text-xs uppercase text-slate-500">Tổng ứng viên</p>
          <p class="mt-2 text-2xl font-bold">{{ candidates().length }}</p>
        </article>
        <article class="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p class="text-xs uppercase text-emerald-700">Đã nhận việc (tháng này)</p>
          <p class="mt-2 text-2xl font-bold text-emerald-700">{{ groupedCandidates().hired.length }}</p>
        </article>
      </div>

      <div class="grid gap-4 lg:grid-cols-5">
        @for (column of columns; track column.key) {
          <section class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div class="flex items-center justify-between">
              <h4 class="text-sm font-semibold uppercase text-slate-600">{{ column.label }}</h4>
              <span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                {{ groupedCandidates()[column.key].length }}
              </span>
            </div>
            <div class="mt-3 space-y-3">
              @for (candidate of groupedCandidates()[column.key]; track candidate.id) {
                <article class="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p class="text-sm font-medium">{{ candidate.fullName }}</p>
                  <p class="text-xs text-slate-500">{{ candidate.appliedRole }}</p>
                  <p class="mt-2 text-xs text-slate-400">{{ candidate.email }}</p>
                </article>
              }
            </div>
          </section>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecruitmentBoardComponent {
  readonly columns: { key: CandidateStage; label: string }[] = [
    { key: 'sourcing', label: 'Nguồn ứng viên' },
    { key: 'screening', label: 'Sơ loại' },
    { key: 'interview', label: 'Phỏng vấn' },
    { key: 'offer', label: 'Offer' },
    { key: 'hired', label: 'Nhận việc' }
  ];

  readonly candidates = signal<Candidate[]>([
    { id: 'C1', fullName: 'Phạm Linh Chi', email: 'chi@gmail.com', appliedRole: 'Kỹ sư QA', stage: 'screening' },
    { id: 'C2', fullName: 'Lê Văn Đức', email: 'duc@gmail.com', appliedRole: 'Backend Developer', stage: 'interview' },
    { id: 'C3', fullName: 'Võ Gia Hân', email: 'han@gmail.com', appliedRole: 'Thiết kế UI', stage: 'offer' },
    { id: 'C4', fullName: 'Trần Kim Ngân', email: 'ngan@gmail.com', appliedRole: 'HRBP', stage: 'hired' },
    { id: 'C5', fullName: 'Bùi Gia Hưng', email: 'hung@gmail.com', appliedRole: 'Phân tích dữ liệu', stage: 'sourcing' }
  ]);

  readonly groupedCandidates = computed(() => {
    return this.columns.reduce(
      (acc, col) => {
        acc[col.key] = this.candidates().filter((candidate) => candidate.stage === col.key);
        return acc;
      },
      {} as Record<CandidateStage, Candidate[]>
    );
  });
}
