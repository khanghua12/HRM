import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { OffboardingCase, OffboardingStatus } from '../models/offboarding.model';

type OffboardingFilter = { q?: string; status?: OffboardingStatus | '' };

@Injectable({ providedIn: 'root' })
export class OffboardingStore {
  private readonly http = inject(HttpClient);

  list(filter: OffboardingFilter = {}): Observable<OffboardingCase[]> {
    return this.http.get<OffboardingCase[]>(`${environment.apiBaseUrl}/offboarding`).pipe(
      map((rows) => {
        let out = rows;
        const q = (filter.q ?? '').trim().toLowerCase();
        if (q) out = out.filter((x) => x.employeeName.toLowerCase().includes(q) || x.department.toLowerCase().includes(q));
        if (filter.status) out = out.filter((x) => x.status === filter.status);
        return out;
      })
    );
  }

  create(input: Omit<OffboardingCase, 'id' | 'createdAt'>): Observable<OffboardingCase> {
    return this.http.post<OffboardingCase>(`${environment.apiBaseUrl}/offboarding`, input);
  }

  updateStatus(id0: string, status: OffboardingStatus): Observable<{ ok: boolean }> {
    return this.http.patch<{ ok: boolean }>(`${environment.apiBaseUrl}/offboarding/${id0}/status`, { status });
  }
}
