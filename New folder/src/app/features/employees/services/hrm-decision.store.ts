import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { HrmDecision, HrmDecisionStatus, HrmDecisionType } from '../models/hrm-decision.model';

type DecisionFilter = { q?: string; type?: HrmDecisionType | ''; status?: HrmDecisionStatus | '' };

@Injectable({ providedIn: 'root' })
export class HrmDecisionStore {
  private readonly http = inject(HttpClient);

  list(filter: DecisionFilter = {}): Observable<HrmDecision[]> {
    return this.http.get<HrmDecision[]>(`${environment.apiBaseUrl}/decisions`).pipe(
      map((rows) => {
        let out = rows;
        const q = (filter.q ?? '').trim().toLowerCase();
        if (q) out = out.filter((x) => x.code.toLowerCase().includes(q) || x.employeeName.toLowerCase().includes(q));
        if (filter.type) out = out.filter((x) => x.type === filter.type);
        if (filter.status) out = out.filter((x) => x.status === filter.status);
        return out;
      })
    );
  }

  create(input: Omit<HrmDecision, 'id' | 'createdAt'>): Observable<HrmDecision> {
    return this.http.post<HrmDecision>(`${environment.apiBaseUrl}/decisions`, input);
  }

  updateStatus(id: string, status: HrmDecisionStatus): Observable<{ ok: boolean }> {
    return this.http.patch<{ ok: boolean }>(`${environment.apiBaseUrl}/decisions/${id}/status`, { status });
  }
}
