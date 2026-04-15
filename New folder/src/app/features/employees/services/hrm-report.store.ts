import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, of } from 'rxjs';
import type { HrmReportDefinition, ReportKind } from '../models/hrm-report.model';

@Injectable({ providedIn: 'root' })
export class HrmReportStore {
  private readonly _reports$ = new BehaviorSubject<HrmReportDefinition[]>(seed());
  readonly reports$ = this._reports$.asObservable();

  list(q: string): Observable<HrmReportDefinition[]> {
    const needle = q.trim().toLowerCase();
    return this.reports$.pipe(
      map((rows) => {
        if (!needle) return rows;
        return rows.filter((x) => x.name.toLowerCase().includes(needle) || x.description.toLowerCase().includes(needle));
      })
    );
  }

  run(id0: string): Observable<{ ok: boolean; at: string }> {
    const at = new Date().toISOString();
    this._reports$.next(this._reports$.value.map((x) => (x.id === id0 ? { ...x, lastRunAt: at } : x)));
    return of({ ok: true, at });
  }

  exportCsv(kind: ReportKind): Observable<{ filename: string; content: string }> {
    const header = 'metric,value\n';
    const body =
      kind === 'headcount'
        ? 'total,44\nactive,22\nprobation,4\n'
        : kind === 'turnover'
          ? 'resign,2\nterminate,0\n'
          : 'sample,1\n';
    return of({ filename: `report-${kind}-${new Date().toISOString().slice(0, 10)}.csv`, content: header + body });
  }
}

function seed(): HrmReportDefinition[] {
  return [
    {
      id: 'RPT-001',
      name: 'Báo cáo headcount theo trạng thái',
      kind: 'headcount',
      description: 'Tổng hợp nhân sự theo trạng thái (chính thức/thử việc/thực tập/...).',
      lastRunAt: null
    },
    {
      id: 'RPT-002',
      name: 'Báo cáo biến động nhân sự (turnover)',
      kind: 'turnover',
      description: 'Theo dõi tiếp nhận/nghỉ việc theo thời gian.',
      lastRunAt: null
    },
    {
      id: 'RPT-003',
      name: 'Báo cáo cơ cấu giới tính',
      kind: 'gender',
      description: 'Tỷ lệ Nam/Nữ/Khác theo phòng ban.',
      lastRunAt: null
    }
  ];
}

