import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { combineLatest, switchMap } from 'rxjs';
import type { CandidateStage } from '../../../../models/recruitment.model';
import { RecruitmentDigitalStore } from '../../services/recruitment-digital.store';

@Component({
  selector: 'app-recruitment-candidates',
  standalone: true,
  imports: [AsyncPipe, DatePipe, RouterLink],
  template: `
    <section class="space-y-4">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <div class="grid gap-2 md:grid-cols-4">
          <input
            class="h-9 rounded border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500"
            placeholder="Tìm ứng viên..."
            [value]="q()"
            (input)="onSearch($any($event.target).value)"
          />
          <select
            class="h-9 rounded border border-slate-200 bg-white px-2 text-sm outline-none focus:border-indigo-500"
            [value]="stage()"
            (change)="onStageChange($any($event.target).value)"
          >
            <option value="">Tất cả giai đoạn</option>
            <option value="sourcing">Nguồn</option>
            <option value="screening">Sơ loại</option>
            <option value="interview">Phỏng vấn</option>
            <option value="offer">Offer</option>
            <option value="hired">Nhận việc</option>
            <option value="rejected">Loại</option>
          </select>
          <div class="md:col-span-2 flex justify-end">
            <select
              class="h-9 rounded border border-slate-200 bg-white px-2 text-sm outline-none focus:border-indigo-500"
              [value]="pageSize()"
              (change)="onPageSizeChange($any($event.target).value)"
            >
              <option [value]="10">10 / trang</option>
              <option [value]="20">20 / trang</option>
              <option [value]="50">50 / trang</option>
            </select>
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white">
        <div class="overflow-auto">
          <table class="min-w-full divide-y divide-slate-200 text-sm">
            <thead class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th class="px-3 py-2">Họ tên</th>
                <th class="px-3 py-2">Email</th>
                <th class="px-3 py-2">SĐT</th>
                <th class="px-3 py-2">Vị trí</th>
                <th class="px-3 py-2">Nguồn</th>
                <th class="px-3 py-2">Ngày apply</th>
                <th class="px-3 py-2">Giai đoạn</th>
                <th class="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @if (view$ | async; as v) {
                @for (c of v.rows; track c.id) {
                  <tr class="bg-white hover:bg-slate-50">
                    <td class="px-3 py-2 font-medium text-slate-900">{{ c.fullName }}</td>
                    <td class="px-3 py-2 text-slate-700">{{ c.email }}</td>
                    <td class="px-3 py-2 text-slate-700">{{ c.phone }}</td>
                    <td class="px-3 py-2 text-slate-700">{{ c.appliedRole }}</td>
                    <td class="px-3 py-2 text-slate-700">{{ sourceLabel(c.source) }}</td>
                    <td class="px-3 py-2 text-slate-700">{{ c.appliedAt | date:'dd/MM/yyyy HH:mm' }}</td>
                    <td class="px-3 py-2 text-slate-700">{{ stageLabel(c.stage) }}</td>
                    <td class="px-3 py-2 text-right">
                      <a
                        [routerLink]="['/recruitment/candidates', c.id]"
                        class="rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
                      >
                        Xem chi tiết
                      </a>
                    </td>
                  </tr>
                }
                @if (v.rows.length === 0) {
                  <tr><td colspan="8" class="px-3 py-8 text-center text-slate-500">Không có hồ sơ.</td></tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>

      @if (view$ | async; as v) {
        <div class="flex flex-wrap items-center justify-between gap-2 text-sm">
          <div class="text-slate-500">Hiển thị {{ rangeStart(v.total) }}-{{ rangeEnd(v.total) }} / {{ v.total }}</div>
          <div class="flex items-center gap-1">
            <button
              type="button"
              class="h-9 rounded border border-slate-200 bg-white px-3 hover:bg-slate-50 disabled:opacity-50"
              [disabled]="page() <= 1"
              (click)="go(page() - 1)"
            >
              Trước
            </button>
            <span class="px-2 text-xs text-slate-500">Trang {{ page() }}/{{ totalPages(v.total) }}</span>
            <button
              type="button"
              class="h-9 rounded border border-slate-200 bg-white px-3 hover:bg-slate-50 disabled:opacity-50"
              [disabled]="page() >= totalPages(v.total)"
              (click)="go(page() + 1)"
            >
              Sau
            </button>
          </div>
        </div>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecruitmentCandidatesComponent {
  private readonly store = inject(RecruitmentDigitalStore);
  readonly q = signal('');
  readonly stage = signal<CandidateStage | ''>('');
  readonly page = signal(1);
  readonly pageSize = signal(10);

  readonly view$ = combineLatest([
    toObservable(this.q),
    toObservable(this.stage),
    toObservable(this.page),
    toObservable(this.pageSize)
  ]).pipe(
    switchMap(() =>
      this.store.listCandidates({
        q: this.q(),
        stage: this.stage(),
        page: this.page(),
        pageSize: this.pageSize()
      })
    )
  );

  onSearch(v: string): void {
    this.q.set(v);
    this.page.set(1);
  }
  onStageChange(v: string): void {
    this.stage.set((v as CandidateStage | '') ?? '');
    this.page.set(1);
  }
  onPageSizeChange(v: string): void {
    this.pageSize.set(parseInt(v, 10) || 10);
    this.page.set(1);
  }
  go(p: number): void {
    this.page.set(Math.max(1, p));
  }
  totalPages(total: number): number {
    return Math.max(1, Math.ceil(total / this.pageSize()));
  }
  rangeStart(total: number): number {
    if (total === 0) return 0;
    return (this.page() - 1) * this.pageSize() + 1;
  }
  rangeEnd(total: number): number {
    return Math.min(total, this.page() * this.pageSize());
  }
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

