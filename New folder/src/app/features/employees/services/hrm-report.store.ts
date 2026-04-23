import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { HrmReportDefinition, ReportKind } from '../models/hrm-report.model';

@Injectable({ providedIn: 'root' })
export class HrmReportStore {
  private readonly http = inject(HttpClient);

  list(q: string): Observable<HrmReportDefinition[]> {
    const needle = q.trim().toLowerCase();
    return this.http.get<HrmReportDefinition[]>(`${environment.apiBaseUrl}/reports`).pipe(
      map((rows) => (needle ? rows.filter((x) => x.name.toLowerCase().includes(needle) || x.description.toLowerCase().includes(needle)) : rows))
    );
  }

  run(id0: string): Observable<{ ok: boolean; at: string }> {
    return this.http.post<{ ok: boolean; at: string }>(`${environment.apiBaseUrl}/reports/${id0}/run`, {});
  }

  exportCsv(kind: ReportKind): Observable<{ filename: string; content: string }> {
    return this.list('').pipe(
      map((rows) => ({
        filename: `report-${kind}-${new Date().toISOString().slice(0, 10)}.csv`,
        content: 'report,kind,lastRunAt\n' + rows.filter((r) => r.kind === kind).map((r) => `${r.name},${r.kind},${r.lastRunAt ?? ''}`).join('\n')
      }))
    );
  }
}
