import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-placeholder',
  standalone: true,
  template: `
    <section class="rounded-xl border border-slate-200 bg-white p-6">
      <h3 class="text-lg font-semibold text-slate-900">{{ title }}</h3>
      <p class="mt-1 text-sm text-slate-500">Trang này đang được xây dựng.</p>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlaceholderComponent {
  private readonly route = inject(ActivatedRoute);
  get title(): string {
    return (this.route.snapshot.data['title'] as string | undefined) ?? 'Đang cập nhật';
  }
}

