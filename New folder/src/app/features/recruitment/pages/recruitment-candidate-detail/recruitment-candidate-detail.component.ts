import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { RecruitmentDigitalStore } from '../../services/recruitment-digital.store';

@Component({
  selector: 'app-recruitment-candidate-detail',
  standalone: true,
  imports: [AsyncPipe, DatePipe, RouterLink],
  template: `
    @if (candidate$ | async; as c) {
      @if (c) {
        <section class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-base font-semibold text-slate-900">{{ c.fullName }}</h3>
              <p class="mt-1 text-xs text-slate-500">Chi tiết hồ sơ ứng viên và CV</p>
            </div>
            <a
              [routerLink]="['/recruitment/candidates']"
              class="h-9 rounded border border-slate-200 bg-white px-3 text-sm hover:bg-slate-50"
            >
              Quay lại danh sách
            </a>
          </div>

          <article class="rounded-xl border border-slate-200 bg-white p-4">
            <h4 class="text-sm font-semibold text-slate-900">Thông tin ứng viên</h4>
            <div class="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-2 xl:grid-cols-3">
              <div><span class="text-slate-500">Email:</span> <span class="text-slate-800">{{ c.email }}</span></div>
              <div><span class="text-slate-500">SĐT:</span> <span class="text-slate-800">{{ c.phone }}</span></div>
              <div><span class="text-slate-500">Vị trí:</span> <span class="text-slate-800">{{ c.appliedRole }}</span></div>
              <div><span class="text-slate-500">Nguồn:</span> <span class="text-slate-800">{{ sourceLabel(c.source) }}</span></div>
              <div><span class="text-slate-500">Kinh nghiệm:</span> <span class="text-slate-800">{{ c.yearsOfExperience }} năm</span></div>
              <div><span class="text-slate-500">Thành phố:</span> <span class="text-slate-800">{{ c.city }}</span></div>
              <div><span class="text-slate-500">Ngày apply:</span> <span class="text-slate-800">{{ c.appliedAt | date:'dd/MM/yyyy HH:mm' }}</span></div>
              <div><span class="text-slate-500">Giai đoạn:</span> <span class="text-slate-800">{{ stageLabel(c.stage) }}</span></div>
            </div>
            <div class="mt-3">
              <p class="text-xs text-slate-500">Kỹ năng</p>
              <div class="mt-2 flex flex-wrap gap-2">
                @for (skill of c.skills; track skill) {
                  <span class="rounded-full bg-indigo-50 px-2.5 py-1 text-xs text-indigo-700">{{ skill }}</span>
                }
              </div>
            </div>
            <div class="mt-3">
              <p class="text-xs text-slate-500">Tóm tắt</p>
              <p class="mt-1 text-sm text-slate-700">{{ c.summary }}</p>
            </div>
          </article>

          <article class="rounded-xl border border-slate-200 bg-white p-4">
            <div class="flex items-center justify-between">
              <h4 class="text-sm font-semibold text-slate-900">CV đính kèm</h4>
              <a
                [href]="c.cvUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="h-9 rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                Mở/Tải CV
              </a>
            </div>
            <p class="mt-1 text-xs text-slate-500">{{ c.cvFileName }}</p>
            <div class="mt-3 h-[640px] overflow-hidden rounded border border-slate-200">
              <iframe [src]="c.cvUrl" class="h-full w-full" title="CV Preview"></iframe>
            </div>
          </article>
        </section>
      } @else {
        <section class="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Không tìm thấy hồ sơ ứng viên.
        </section>
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecruitmentCandidateDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(RecruitmentDigitalStore);

  readonly candidate$ = this.route.paramMap.pipe(
    map((p) => p.get('id') ?? ''),
    switchMap((id) => this.store.getCandidateById(id))
  );

  sourceLabel(v: string): string {
    const m: Record<string, string> = {
      'google-form': 'Google Form',
      linkedin: 'LinkedIn',
      facebook: 'Facebook',
      referral: 'Giới thiệu',
      other: 'Khác'
    };
    return m[v] ?? v;
  }

  stageLabel(v: string): string {
    const m: Record<string, string> = {
      sourcing: 'Nguồn',
      screening: 'Sơ loại',
      interview: 'Phỏng vấn',
      offer: 'Offer',
      hired: 'Nhận việc',
      rejected: 'Loại'
    };
    return m[v] ?? v;
  }
}

