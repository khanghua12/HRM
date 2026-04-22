import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

interface TemplateField {
  label: string;
  value: string;
}

interface FormTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  fields: TemplateField[];
}

const DEFAULT_HEADER = 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc';

@Component({
  selector: 'app-form-templates',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <div class="rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 p-6 text-white shadow-sm">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-2xl space-y-2">
            <p class="text-sm/6 uppercase tracking-[0.2em] text-violet-100">Mẫu đơn</p>
            <h3 class="text-3xl font-semibold">Tạo, lưu và dùng lại mẫu đơn</h3>
            <p class="text-sm text-violet-50">Chọn một mẫu đã lưu để sửa, hoặc tạo mẫu mới để sử dụng trực tiếp hay in ra khi cần.</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button class="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-violet-700 shadow-sm" type="button" (click)="startNewTemplate()">Tạo mẫu</button>
            <button class="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/30 hover:bg-white/15" type="button" (click)="exportPdf()">Xuất PDF đơn</button>
          </div>
        </div>
      </div>

      <section class="grid gap-4 xl:grid-cols-3">
        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h4 class="text-lg font-semibold text-slate-900">{{ editingMode() ? 'Sửa mẫu đơn' : 'Tạo mẫu đơn' }}</h4>
              <p class="text-sm text-slate-500">{{ editingMode() ? 'Chỉnh sửa mẫu đã chọn rồi lưu lại' : 'Điền nội dung và lưu thành mẫu sử dụng lại' }}</p>
            </div>
            <button class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50" type="button" (click)="startNewTemplate()">Mẫu mới</button>
          </div>

          <form class="mt-4 grid gap-4" [formGroup]="templateForm" (ngSubmit)="saveTemplate()">
            <div class="grid gap-3 md:grid-cols-2">
              <label class="space-y-1 text-sm text-slate-700">
                <span>Tên mẫu</span>
                <input class="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-violet-500" formControlName="name" />
              </label>
              <label class="space-y-1 text-sm text-slate-700">
                <span>Danh mục</span>
                <input class="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-violet-500" formControlName="category" placeholder="Nghỉ phép, đề nghị, tạm ứng..." />
              </label>
            </div>
            <label class="space-y-1 text-sm text-slate-700">
              <span>Tiêu đề phụ / mô tả</span>
              <textarea class="min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-violet-500" formControlName="description" placeholder="Mô tả ngắn cho mẫu đơn"></textarea>
            </label>
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div class="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h5 class="text-sm font-semibold text-slate-900">Trường thông tin chính</h5>
                  <p class="text-xs text-slate-500">Chỉ nhập tên field ở đây, giá trị nhập bên dưới form điền trực tiếp.</p>
                </div>
                <button class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50" type="button" (click)="addField()">Thêm trường</button>
              </div>
              <div class="max-h-[420px] space-y-3 overflow-y-auto pr-1" formArrayName="fields">
                @for (field of fields.controls; track $index; let i = $index) {
                  <fieldset class="rounded-xl border border-slate-200 bg-white p-4" [formGroupName]="i" [class.md:col-span-2]="isFullWidthField(field.controls.label.value)">
                    <legend class="px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{{ isFullWidthField(field.controls.label.value) ? 'Trường dài' : 'Trường thông tin' }}</legend>
                    <div [class.grid]="true" [class.gap-3]="true" [class.md:grid-cols-2]="!isFullWidthField(field.controls.label.value)">
                      <label class="block space-y-1 text-sm text-slate-700" [class.md:col-span-2]="isFullWidthField(field.controls.label.value)">
                        <span>Tên field</span>
                        <input class="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-violet-500" formControlName="label" placeholder="Ví dụ: Họ và tên" />
                      </label>
                      <label class="block space-y-1 text-sm text-slate-700" [class.md:col-span-2]="isFullWidthField(field.controls.label.value)">
                        <span>Giá trị mặc định</span>
                        <input class="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-violet-500" formControlName="value" placeholder="Ví dụ: Nguyễn Văn A" />
                      </label>
                      <div class="pt-1" [class.md:col-span-2]="isFullWidthField(field.controls.label.value)">
                        <button class="h-10 rounded-lg border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-600 hover:bg-rose-50" type="button" (click)="removeField(i)" [disabled]="fields.length === 1">Xóa</button>
                      </div>
                    </div>
                  </fieldset>
                }
              </div>
            </div>
            <div class="flex flex-wrap gap-2">
              <button class="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700" type="submit">{{ editingMode() ? 'Cập nhật mẫu đơn' : 'Lưu mẫu đơn' }}</button>
              <button class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" type="button" (click)="useTemplate()">Sử dụng trực tiếp</button>
            </div>
          </form>
        </article>

        <aside class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 class="text-lg font-semibold text-slate-900">Mẫu đã lưu</h4>
          <div class="mt-4 space-y-3">
            @for (template of templates(); track template.id) {
              <button class="w-full rounded-xl border border-slate-200 p-4 text-left hover:bg-slate-50" type="button" (click)="selectTemplate(template.id)">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <div class="font-medium text-slate-900">{{ template.name }}</div>
                    <div class="text-xs text-slate-500">{{ template.category }}</div>
                  </div>
                  <span class="rounded-full bg-violet-50 px-2 py-1 text-[11px] font-semibold text-violet-700">{{ template.fields.length }} trường</span>
                </div>
                <p class="mt-2 text-sm text-slate-500">{{ template.description }}</p>
              </button>
            }
          </div>
        </aside>
      </section>

      @if (activeTemplate()) {
        <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h4 class="text-lg font-semibold text-slate-900">Xem trước mẫu đơn</h4>
              <p class="text-sm text-slate-500">Có thể dùng ngay hoặc in ra giấy</p>
            </div>
            <div class="flex gap-2">
              <button class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" type="button" (click)="useTemplate()">Dùng trực tiếp</button>
              <button class="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700" type="button" (click)="exportPdf()">Xuất PDF</button>
            </div>
          </div>

          <div class="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div class="mx-auto max-w-3xl rounded-xl bg-white p-8 shadow-sm">
              <div class="text-center text-sm font-semibold uppercase tracking-wide text-slate-900 whitespace-pre-line">{{ legalHeader }}</div>
              <div class="mt-2 flex justify-center">
                <div class="h-px w-36 bg-slate-900"></div>
              </div>
              <div class="mt-6 text-center">
                <p class="text-xs uppercase tracking-[0.2em] text-slate-500">{{ activeTemplate()!.category }}</p>
                <h5 class="mt-1 text-2xl font-semibold text-slate-900">{{ activeTemplate()!.name }}</h5>
                <p class="mt-2 text-sm text-slate-600">{{ activeTemplate()!.description }}</p>
              </div>

              <form class="mt-6 grid gap-4 md:grid-cols-2">
                @for (field of activeTemplate()!.fields; track field.label) {
                  <div class="space-y-2" [class.md:col-span-2]="isFullWidthField(field.label)">
                    <label class="block text-sm font-medium text-slate-700">
                      {{ field.label }}
                    </label>
                    <input
                      class="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-violet-500"
                      [class.md:col-span-2]="isFullWidthField(field.label)"
                      [value]="field.value"
                    />
                  </div>
                }
              </form>

              <div class="mt-8 grid grid-cols-2 gap-10 text-sm text-slate-700">
                <div class="text-center">
                  <p class="font-semibold uppercase">Người làm đơn</p>
                  <div class="mt-16 border-t border-dashed border-slate-400 pt-2 text-slate-500">Ký, ghi rõ họ tên</div>
                </div>
                <div class="text-center">
                  <p class="font-semibold uppercase">Người duyệt</p>
                  <div class="mt-16 border-t border-dashed border-slate-400 pt-2 text-slate-500">Ký, ghi rõ họ tên</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormTemplatesComponent {
  private readonly fb = inject(FormBuilder);

  readonly legalHeader = DEFAULT_HEADER;
  readonly templates = signal<FormTemplate[]>([
    {
      id: 'tpl-01',
      name: 'Đơn nghỉ phép',
      category: 'Nghỉ phép',
      description: 'Mẫu đơn xin nghỉ phép tiêu chuẩn cho nhân viên.',
      fields: [
        { label: 'Họ và tên', value: 'Nguyễn Minh Anh' },
        { label: 'Phòng ban', value: 'Nhân sự' },
        { label: 'Số ngày nghỉ', value: '2 ngày' },
        { label: 'Lý do', value: 'Việc cá nhân' }
      ]
    }
  ]);

  readonly activeTemplateId = signal<string | null>('tpl-01');
  readonly editingMode = signal(false);

  readonly templateForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    category: ['', Validators.required],
    description: ['', Validators.required],
    fields: this.fb.array([
      this.createFieldGroup('Họ và tên', 'Nguyễn Minh Anh')
    ])
  });

  get fields() {
    return this.templateForm.controls.fields;
  }

  readonly activeTemplate = computed(() => this.templates().find((item) => item.id === this.activeTemplateId()) ?? null);

  private createFieldGroup(label = '', value = '') {
    return this.fb.nonNullable.group({
      label: [label, Validators.required],
      value: [value, Validators.required]
    });
  }

  isFullWidthField(label: string | null | undefined): boolean {
    const text = (label ?? '').toLowerCase();
    return text.includes('lý do') || text.includes('nội dung') || text.includes('ghi chú') || text.includes('mô tả') || text.includes('địa chỉ') || text.includes('từ ngày') || text.includes('đến ngày') || text.includes('lý do xin');
  }

  private resetFieldArray(fields: TemplateField[]): void {
    while (this.fields.length) {
      this.fields.removeAt(0);
    }
    if (fields.length === 0) {
      this.fields.push(this.createFieldGroup());
      return;
    }
    fields.forEach((field) => this.fields.push(this.createFieldGroup(field.label, field.value)));
  }

  selectTemplate(id: string): void {
    this.activeTemplateId.set(id);
    const template = this.activeTemplate();
    if (!template) return;
    this.editingMode.set(true);
    this.templateForm.patchValue({
      name: template.name,
      category: template.category,
      description: template.description
    });
    this.resetFieldArray(template.fields);
  }

  startNewTemplate(): void {
    this.activeTemplateId.set(null);
    this.editingMode.set(false);
    this.templateForm.reset({
      name: '',
      category: '',
      description: ''
    });
    this.resetFieldArray([{ label: '', value: '' }]);
  }

  addField(): void {
    this.fields.push(this.createFieldGroup());
  }

  removeField(index: number): void {
    if (this.fields.length === 1) return;
    this.fields.removeAt(index);
  }

  saveTemplate(): void {
    if (this.templateForm.invalid) {
      this.templateForm.markAllAsTouched();
      return;
    }

    const value = this.templateForm.getRawValue();
    const fields = value.fields
      .map((field) => ({ label: field.label.trim(), value: field.value.trim() }))
      .filter((field) => field.label.length > 0);

    if (fields.length === 0) {
      this.fields.markAllAsTouched();
      return;
    }

    const currentId = this.activeTemplateId();
    if (currentId) {
      this.templates.update((items) =>
        items.map((item) =>
          item.id === currentId
            ? {
                ...item,
                name: value.name,
                category: value.category,
                description: value.description,
                fields
              }
            : item
        )
      );
      this.editingMode.set(true);
    } else {
      const id = crypto.randomUUID();
      this.templates.update((items) => [
        {
          id,
          name: value.name,
          category: value.category,
          description: value.description,
          fields
        },
        ...items
      ]);
      this.activeTemplateId.set(id);
      this.editingMode.set(true);
    }
  }

  useTemplate(): void {
    const template = this.activeTemplate();
    if (!template) return;
    this.templateForm.patchValue({
      name: template.name,
      category: template.category,
      description: template.description
    });
    this.resetFieldArray(template.fields);
  }

  exportPdf(): void {
    const template = this.activeTemplate();
    if (!template) return;

    const fieldsHtml = template.fields
      .map(
        (field) => `
          <div class="field-row ${this.isFullWidthField(field.label) ? 'full-width' : ''}">
            <div class="label">${field.label}</div>
            <div class="value">${field.value || '&nbsp;'}</div>
          </div>`
      )
      .join('');

    const html = `
      <html>
        <head>
          <title>${template.name}</title>
          <style>
            @page { size: A4; margin: 20mm; }
            html, body { margin: 0; padding: 0; }
            body { font-family: Arial, sans-serif; color: #111827; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .page { max-width: 100%; border: 1px solid #e5e7eb; padding: 18mm 16mm; box-sizing: border-box; }
            .header { text-align: center; font-weight: 700; font-size: 15px; line-height: 1.5; white-space: pre-line; }
            .header-line { width: 180px; height: 1px; background: #111827; margin: 8px auto 0; }
            .title { text-align: center; margin: 18px 0 6px; font-size: 22px; font-weight: 700; text-transform: uppercase; }
            .subtitle { text-align: center; color: #374151; margin-bottom: 18px; }
            .field-row { display: grid; grid-template-columns: 34% 1fr; gap: 14px; align-items: start; margin-bottom: 12px; }
            .field-row.full-width { grid-template-columns: 100%; }
            .label { font-weight: 600; line-height: 1.5; }
            .value { min-height: 22px; border-bottom: 1px dotted #9ca3af; padding-bottom: 2px; line-height: 1.5; }
            .field-row.full-width .value { min-height: 48px; }
            .footer { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin-top: 48px; }
            .sign { text-align: center; }
            .sign-title { font-weight: 700; text-transform: uppercase; }
            .sign-line { margin-top: 72px; border-top: 1px dashed #6b7280; padding-top: 6px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="header">${this.legalHeader.replace(/\n/g, '<br />')}</div>
            <div class="header-line"></div>
            <div class="title">${template.name}</div>
            <div class="subtitle">${template.category} · ${template.description}</div>
            ${fieldsHtml}
            <div class="footer">
              <div class="sign">
                <div class="sign-title">Người làm đơn</div>
                <div class="sign-line">Ký, ghi rõ họ tên</div>
              </div>
              <div class="sign">
                <div class="sign-title">Người duyệt</div>
                <div class="sign-line">Ký, ghi rõ họ tên</div>
              </div>
            </div>
          </div>
          <script>
            window.onload = () => {
              window.print();
              window.onafterprint = () => window.close();
            };
          </script>
        </body>
      </html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank', 'width=900,height=700');
    if (!win) {
      URL.revokeObjectURL(url);
      return;
    }
    win.addEventListener('beforeunload', () => URL.revokeObjectURL(url));
  }
}
