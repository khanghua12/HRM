import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RecruitmentDigitalStore } from '../../services/recruitment-digital.store';

@Component({
  selector: 'app-recruitment-integrations',
  standalone: true,
  imports: [AsyncPipe, DatePipe, ReactiveFormsModule],
  template: `
    <section class="space-y-4">
      <article class="rounded-xl border border-slate-200 bg-white p-4">
        <h4 class="text-sm font-semibold text-slate-900">Kết nối Google Form qua Google Sheet</h4>
        <p class="mt-1 text-xs text-slate-500">
          FE đang mock flow. Khi có BE, endpoint sync sẽ đọc Google Sheets API và đẩy dữ liệu ứng viên về hệ thống.
        </p>

        <form class="mt-4 grid gap-3 md:grid-cols-3" [formGroup]="form">
          <div>
            <label class="text-xs text-slate-600">Google Sheet ID</label>
            <input class="mt-1 h-9 w-full rounded border border-slate-200 px-2 text-sm" formControlName="sheetId" />
          </div>
          <div>
            <label class="text-xs text-slate-600">Range</label>
            <input class="mt-1 h-9 w-full rounded border border-slate-200 px-2 text-sm" formControlName="range" />
          </div>
          <div>
            <label class="text-xs text-slate-600">API Key (tạm)</label>
            <input class="mt-1 h-9 w-full rounded border border-slate-200 px-2 text-sm" formControlName="apiKey" />
          </div>
        </form>

        <div class="mt-4 flex gap-2">
          <button
            type="button"
            class="h-9 rounded border border-slate-200 bg-white px-4 text-sm hover:bg-slate-50"
            [disabled]="form.invalid"
            (click)="saveConfig()"
          >
            Lưu cấu hình
          </button>
          <button
            type="button"
            class="h-9 rounded bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-500"
            (click)="runSync()"
          >
            Sync ngay
          </button>
        </div>
      </article>

      @if (message()) {
        <div class="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {{ message() }}
        </div>
      }

      <article class="rounded-xl border border-slate-200 bg-white">
        <div class="border-b border-slate-200 px-4 py-3">
          <h4 class="text-sm font-semibold text-slate-900">Lịch sử đồng bộ</h4>
        </div>
        <div class="overflow-auto">
          <table class="min-w-full divide-y divide-slate-200 text-sm">
            <thead class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th class="px-3 py-2">Thời gian</th>
                <th class="px-3 py-2">Số hồ sơ import</th>
                <th class="px-3 py-2">Trạng thái</th>
                <th class="px-3 py-2">Ghi chú</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @if (runs$ | async; as runs) {
                @for (r of runs; track r.id) {
                  <tr class="bg-white">
                    <td class="px-3 py-2 text-slate-700">{{ r.syncedAt | date:'dd/MM/yyyy HH:mm:ss' }}</td>
                    <td class="px-3 py-2 text-slate-700">{{ r.imported }}</td>
                    <td class="px-3 py-2 text-slate-700">{{ r.status }}</td>
                    <td class="px-3 py-2 text-slate-700">{{ r.note }}</td>
                  </tr>
                }
                @if (runs.length === 0) {
                  <tr><td colspan="4" class="px-3 py-6 text-center text-slate-500">Chưa có lần sync nào.</td></tr>
                }
              }
            </tbody>
          </table>
        </div>
      </article>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecruitmentIntegrationsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(RecruitmentDigitalStore);
  readonly runs$ = this.store.syncRuns$;
  readonly message = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    sheetId: ['', Validators.required],
    range: ['Form Responses 1!A2:H', Validators.required],
    apiKey: ['']
  });

  saveConfig(): void {
    this.store.saveGoogleSheetConfig(this.form.getRawValue());
    this.flash('Đã lưu cấu hình Google Sheet.');
  }
  runSync(): void {
    void this.store.runGoogleSheetSyncMock().subscribe((r) => this.flash(`Sync thành công, import ${r.imported} hồ sơ.`));
  }

  private flash(msg: string): void {
    this.message.set(msg);
    window.setTimeout(() => this.message.set(null), 2200);
  }
}

