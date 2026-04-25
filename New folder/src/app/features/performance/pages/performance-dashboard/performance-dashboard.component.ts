import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';

interface PerformanceReview {
  id: string;
  employeeId: string;
  cycle: string;
  score: number;
  rankLabel: string | null;
  reviewer: string | null;
  note: string | null;
  createdAt: string;
}

interface DelayedTaskReason {
  taskId: string;
  title: string;
  assigneeName: string;
  dueDate: string;
  progress: number;
  reason: string;
}

interface PerformanceDashboardVm {
  kpiPayroll: number;
  kpiWork: number;
  kpiReview: number;
  kpiTotal: number;
  reviews: PerformanceReview[];
  workKpiPassed: boolean;
  delayedTaskReasons: DelayedTaskReason[];
}

@Component({
  selector: 'app-performance-dashboard',
  standalone: true,
  imports: [AsyncPipe, DatePipe, ModalComponent],
  template: `
    <div class="space-y-6">
      <div class="rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 p-6 text-white shadow-sm">
        <h3 class="text-3xl font-semibold">Hiệu suất & KPI</h3>
        <p class="mt-2 text-sm text-indigo-100">Dữ liệu đang lấy thực tế từ DB (Payroll + Work + Performance review).</p>
      </div>

      @if (vm$ | async; as vm) {
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h4 class="text-sm font-semibold text-slate-500">KPI tổng</h4>
            <p class="mt-2 text-3xl font-bold text-indigo-600">{{ vm.kpiTotal }}</p>
          </article>
          <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h4 class="text-sm font-semibold text-slate-500">KPI từ lương</h4>
            <p class="mt-2 text-3xl font-bold text-slate-900">{{ vm.kpiPayroll }}</p>
          </article>
          <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h4 class="text-sm font-semibold text-slate-500">KPI từ công việc</h4>
            <p class="mt-2 text-3xl font-bold text-slate-900">{{ vm.kpiWork }}</p>
            <p class="mt-2 text-xs font-semibold" [class.text-emerald-600]="vm.workKpiPassed" [class.text-rose-600]="!vm.workKpiPassed">
              {{ vm.workKpiPassed ? 'Đạt KPI' : 'Không đạt KPI' }}
            </p>
          </article>
          <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h4 class="text-sm font-semibold text-slate-500">KPI đánh giá kỳ</h4>
            <p class="mt-2 text-3xl font-bold text-slate-900">{{ vm.kpiReview }}</p>
          </article>
        </div>

        <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 class="text-lg font-semibold text-slate-900">Đánh giá KPI theo tiến độ công việc</h4>
          @if (vm.delayedTaskReasons.length === 0) {
            <p class="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Không có công việc trễ tiến độ. KPI công việc đang đạt yêu cầu.
            </p>
          } @else {
            <p class="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Có {{ vm.delayedTaskReasons.length }} công việc trễ tiến độ nên KPI công việc bị đánh giá không đạt.
            </p>
            <div class="mt-4 overflow-x-auto rounded-xl border border-slate-200">
              <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th class="px-4 py-3">Công việc</th>
                    <th class="px-4 py-3">Assignee</th>
                    <th class="px-4 py-3">Hạn</th>
                    <th class="px-4 py-3">Tiến độ</th>
                    <th class="px-4 py-3">Lý do không đạt KPI</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 bg-white">
                  @for (item of vm.delayedTaskReasons; track item.taskId) {
                    <tr class="hover:bg-slate-50">
                      <td class="px-4 py-3 font-medium text-slate-900">{{ item.title }}</td>
                      <td class="px-4 py-3 text-slate-700">{{ item.assigneeName }}</td>
                      <td class="px-4 py-3 text-slate-700">{{ item.dueDate | date: 'dd/MM/yyyy' }}</td>
                      <td class="px-4 py-3 text-slate-700">{{ item.progress }}%</td>
                      <td class="px-4 py-3 text-rose-700">{{ item.reason }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </section>

        <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 class="text-lg font-semibold text-slate-900">Danh sách đánh giá KPI từ DB</h4>
          <div class="mt-4 overflow-x-auto rounded-xl border border-slate-200">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
              <thead class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th class="px-4 py-3">Cycle</th>
                  <th class="px-4 py-3">Employee</th>
                  <th class="px-4 py-3">Score</th>
                  <th class="px-4 py-3">Rank</th>
                  <th class="px-4 py-3">Reviewer</th>
                  <th class="px-4 py-3">Note</th>
                  <th class="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 bg-white">
                @for (r of vm.reviews; track r.id) {
                  <tr class="hover:bg-slate-50">
                    <td class="px-4 py-3">{{ r.cycle }}</td>
                    <td class="px-4 py-3">{{ r.employeeId }}</td>
                    <td class="px-4 py-3 font-semibold">{{ r.score }}</td>
                    <td class="px-4 py-3">{{ r.rankLabel || '—' }}</td>
                    <td class="px-4 py-3">{{ r.reviewer || '—' }}</td>
                    <td class="px-4 py-3">{{ r.note || '—' }}</td>
                    <td class="px-4 py-3">
                      <button
                        type="button"
                        (click)="openReviewDialog(r)"
                        class="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Xem
                      </button>
                    </td>
                  </tr>
                }
                @if (vm.reviews.length === 0) {
                  <tr><td class="px-4 py-8 text-center text-slate-500" colspan="7">Chưa có dữ liệu đánh giá KPI.</td></tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      }

      @if (isReviewDialogOpen && selectedReview) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <app-modal class="block w-full max-w-2xl shadow-2xl">
            <div class="mb-5 flex items-center justify-between">
              <h4 class="text-xl font-semibold text-slate-900">Chi tiết đánh giá KPI</h4>
              <button type="button" (click)="closeReviewDialog()" class="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100">✕</button>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <div class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p class="text-xs text-slate-500">Cycle</p>
                <p class="text-sm font-semibold text-slate-900">{{ selectedReview.cycle }}</p>
              </div>
              <div class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p class="text-xs text-slate-500">Employee</p>
                <p class="text-sm font-semibold text-slate-900">{{ selectedReview.employeeId }}</p>
              </div>
              <div class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p class="text-xs text-slate-500">Score</p>
                <p class="text-sm font-semibold text-slate-900">{{ selectedReview.score }}</p>
              </div>
              <div class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p class="text-xs text-slate-500">Rank</p>
                <p class="text-sm font-semibold text-slate-900">{{ selectedReview.rankLabel || '—' }}</p>
              </div>
              <div class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p class="text-xs text-slate-500">Reviewer</p>
                <p class="text-sm font-semibold text-slate-900">{{ selectedReview.reviewer || '—' }}</p>
              </div>
              <div class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p class="text-xs text-slate-500">Ngày tạo</p>
                <p class="text-sm font-semibold text-slate-900">{{ selectedReview.createdAt | date: 'dd/MM/yyyy HH:mm' }}</p>
              </div>
              <div class="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p class="text-xs text-slate-500">Ghi chú</p>
                <p class="text-sm font-semibold text-slate-900">{{ selectedReview.note || '—' }}</p>
              </div>
            </div>

            <div class="mt-6 flex justify-end">
              <button type="button" (click)="closeReviewDialog()" class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Đóng</button>
            </div>
          </app-modal>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PerformanceDashboardComponent {
  private readonly http = inject(HttpClient);

  isReviewDialogOpen = false;
  selectedReview: PerformanceReview | null = null;

  readonly vm$ = this.http
    .get<PerformanceDashboardVm>(`${environment.apiBaseUrl}/performance/dashboard`)
    .pipe(
      map((vm) => ({
        ...vm,
        delayedTaskReasons: Array.isArray(vm.delayedTaskReasons) ? vm.delayedTaskReasons : [],
        reviews: Array.isArray(vm.reviews) ? vm.reviews : []
      }))
    );

  openReviewDialog(review: PerformanceReview): void {
    this.selectedReview = review;
    this.isReviewDialogOpen = true;
  }

  closeReviewDialog(): void {
    this.isReviewDialogOpen = false;
    this.selectedReview = null;
  }
}
