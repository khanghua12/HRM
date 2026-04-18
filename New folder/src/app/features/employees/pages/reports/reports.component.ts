import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { map, switchMap } from 'rxjs';
import type { ReportKind } from '../../models/hrm-report.model';
import { HrmReportStore } from '../../services/hrm-report.store';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [AsyncPipe, DatePipe, LucideAngularModule],
  template: `
    <section class="space-y-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 class="text-base font-semibold text-slate-900">Báo cáo</h3>
          <p class="mt-1 text-xs text-slate-500">Thư viện báo cáo + chạy báo cáo + xuất CSV (demo mock).</p>
        </div>
        <button class="h-9 rounded border border-slate-200 bg-white px-4 text-sm hover:bg-slate-50" type="button" (click)="exportQuick('headcount')">
          Xuất nhanh headcount (CSV)
        </button>
      </div>

      <div class="rounded-sm border border-slate-200 bg-white p-3">
        <div class="grid gap-2 md:grid-cols-4">
          <input
            class="h-9 rounded border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500"
            placeholder="Tìm báo cáo..."
            [value]="q()"
            (input)="q.set($any($event.target).value)"
          />
          <div class="md:col-span-3 flex items-center justify-end gap-2 text-xs text-slate-500">
            Gợi ý: headcount, turnover, giới tính...
          </div>
        </div>
      </div>

      <div class="rounded-sm border border-slate-200 bg-white">
        <div class="overflow-auto">
          <table class="min-w-full divide-y divide-slate-200 text-sm">
            <thead class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th class="px-3 py-2">Tên báo cáo</th>
                <th class="px-3 py-2">Mô tả</th>
                <th class="px-3 py-2">Chạy gần nhất</th>
                <th class="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @if (rows$ | async; as rows) {
                @for (r of rows; track r.id) {
                  <tr class="bg-white hover:bg-slate-50">
                    <td class="px-3 py-2 font-medium text-slate-900">{{ r.name }}</td>
                    <td class="px-3 py-2 text-slate-700">{{ r.description }}</td>
                    <td class="px-3 py-2 text-slate-700">
                      {{ r.lastRunAt ? (r.lastRunAt | date:'dd/MM/yyyy HH:mm') : '—' }}
                    </td>
                    <td class="px-3 py-2 text-right">
                      <div class="inline-flex gap-1">
                        <button class="h-8 rounded border border-slate-200 bg-white px-2 text-xs hover:bg-slate-50" type="button" (click)="run(r.id)">
                          Chạy
                        </button>
                        <button class="h-8 rounded border border-slate-200 bg-white px-2 text-xs hover:bg-slate-50" type="button" (click)="exportQuick(r.kind)">
                          Xuất CSV
                        </button>
                      </div>
                    </td>
                  </tr>
                }
                @if (rows.length === 0) {
                  <tr><td colspan="4" class="px-3 py-8 text-center text-slate-500">Không tìm thấy báo cáo.</td></tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>

      @if (toast()) {
        <div class="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {{ toast() }}
        </div>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportsComponent {
  private readonly store = inject(HrmReportStore);

  readonly q = signal('');
  readonly toast = signal<string | null>(null);

  readonly rows$ = toObservable(this.q).pipe(switchMap((q) => this.store.list(q)));

  run(id: string): void {
    void this.store.run(id).subscribe((r) => this.flash(`Đã chạy báo cáo lúc ${new Date(r.at).toLocaleString('vi-VN')}.`));
  }

  exportQuick(kind: ReportKind): void {
    void this.store.exportCsv(kind).subscribe((r) => {
      const blob = new Blob([r.content], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = r.filename;
      a.click();
      URL.revokeObjectURL(url);
      this.flash(`Đã xuất ${r.filename}.`);
    });
  }

  private flash(msg: string): void {
    this.toast.set(msg);
    window.setTimeout(() => this.toast.set(null), 2200);
  }
}

