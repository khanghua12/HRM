import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RecruitmentDigitalStore } from '../../services/recruitment-digital.store';

@Component({
  selector: 'app-recruitment-publisher',
  standalone: true,
  imports: [AsyncPipe, DatePipe, ReactiveFormsModule],
  template: `
    <section class="space-y-4">
      <article class="rounded-xl border border-slate-200 bg-white p-4">
        <h4 class="text-sm font-semibold text-slate-900">Auto viết & đăng Facebook Page</h4>
        <p class="mt-1 text-xs text-slate-500">
          FE mock publisher. Khi có BE sẽ nối Facebook Graph API để đăng thật theo lịch.
        </p>

        <form class="mt-4 grid gap-3 md:grid-cols-3" [formGroup]="form">
          <div>
            <label class="text-xs text-slate-600">Chọn vị trí tuyển</label>
            <select class="mt-1 h-9 w-full rounded border border-slate-200 bg-white px-2 text-sm" formControlName="jobId">
              @if (jobs$ | async; as jobs) {
                @for (j of jobs; track j.id) {
                  <option [value]="j.id">{{ j.title }} ({{ j.department }})</option>
                }
              }
            </select>
          </div>
          <div>
            <label class="text-xs text-slate-600">Lịch đăng</label>
            <input type="datetime-local" class="mt-1 h-9 w-full rounded border border-slate-200 px-2 text-sm" formControlName="scheduledAt" />
          </div>
          <div class="flex items-end gap-2">
            <button class="h-9 rounded border border-slate-200 bg-white px-3 text-sm hover:bg-slate-50" type="button" [disabled]="form.invalid" (click)="createDraft()">
              Tạo bài nháp
            </button>
          </div>
        </form>
      </article>

      @if (message()) {
        <div class="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{{ message() }}</div>
      }

      <article class="rounded-xl border border-slate-200 bg-white">
        <div class="border-b border-slate-200 px-4 py-3">
          <h4 class="text-sm font-semibold text-slate-900">Queue bài đăng Facebook</h4>
        </div>
        <div class="overflow-auto">
          <table class="min-w-full divide-y divide-slate-200 text-sm">
            <thead class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th class="px-3 py-2">Vị trí</th>
                <th class="px-3 py-2">Nội dung</th>
                <th class="px-3 py-2">Lịch đăng</th>
                <th class="px-3 py-2">Trạng thái</th>
                <th class="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @if (posts$ | async; as posts) {
                @for (p of posts; track p.id) {
                  <tr class="bg-white">
                    <td class="px-3 py-2 font-medium text-slate-900">{{ p.jobTitle }}</td>
                    <td class="px-3 py-2 text-slate-700">
                      <div class="max-w-xl truncate">{{ p.content }}</div>
                    </td>
                    <td class="px-3 py-2 text-slate-700">
                      {{ p.scheduledAt ? (p.scheduledAt | date:'dd/MM/yyyy HH:mm') : 'Chưa lên lịch' }}
                    </td>
                    <td class="px-3 py-2 text-slate-700">{{ p.status }}</td>
                    <td class="px-3 py-2 text-right">
                      <div class="inline-flex gap-1">
                        <button
                          type="button"
                          class="h-8 rounded border border-slate-200 bg-white px-2 text-xs hover:bg-slate-50 disabled:opacity-50"
                          [disabled]="p.status !== 'draft'"
                          (click)="queue(p.id)"
                        >
                          Queue
                        </button>
                        <button
                          type="button"
                          class="h-8 rounded border border-slate-200 bg-white px-2 text-xs hover:bg-slate-50 disabled:opacity-50"
                          [disabled]="p.status !== 'queued'"
                          (click)="publishNow(p.id)"
                        >
                          Đăng ngay
                        </button>
                      </div>
                    </td>
                  </tr>
                }
                @if (posts.length === 0) {
                  <tr><td colspan="5" class="px-3 py-6 text-center text-slate-500">Chưa có bài.</td></tr>
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
export class RecruitmentPublisherComponent {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(RecruitmentDigitalStore);
  readonly jobs$ = this.store.jobs$;
  readonly posts$ = this.store.fbPosts$;
  readonly message = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    jobId: ['', Validators.required],
    scheduledAt: ['', Validators.required]
  });

  createDraft(): void {
    const { jobId } = this.form.getRawValue();
    if (!jobId) return;
    void this.store.createFacebookPostFromJob(jobId).subscribe((post) => {
      if (!post) return;
      this.flash('Đã tạo bài nháp tự động cho Facebook Page.');
    });
  }

  queue(postId: string): void {
    const at = this.form.controls.scheduledAt.value || new Date(Date.now() + 600000).toISOString().slice(0, 16);
    this.store.queueFacebookPost(postId, new Date(at).toISOString());
    this.flash('Đã đưa bài vào queue.');
  }

  publishNow(postId: string): void {
    this.store.markFacebookPublished(postId);
    this.flash('Đã đánh dấu đăng Facebook thành công (mock).');
  }

  private flash(msg: string): void {
    this.message.set(msg);
    window.setTimeout(() => this.message.set(null), 2200);
  }
}

