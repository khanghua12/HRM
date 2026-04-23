import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, combineLatest, map, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { BenefitCategory, BenefitClaim, BenefitClaimStatus, BenefitPlan } from '../models/benefit.model';

type PlanFilter = { enabled?: boolean | null; category?: BenefitCategory | '' };
type ClaimFilter = { q?: string; status?: BenefitClaimStatus | '' };

@Injectable({ providedIn: 'root' })
export class BenefitStore {
  private readonly http = inject(HttpClient);

  private plans$(): Observable<BenefitPlan[]> {
    return this.http.get<BenefitPlan[]>(`${environment.apiBaseUrl}/benefits/plans`);
  }

  private claims$(): Observable<BenefitClaim[]> {
    return this.http.get<BenefitClaim[]>(`${environment.apiBaseUrl}/benefits/claims`);
  }

  listPlans(filter: PlanFilter = {}): Observable<BenefitPlan[]> {
    return this.plans$().pipe(
      map((rows) => {
        let out = rows;
        if (filter.enabled != null) out = out.filter((x) => Boolean(x.enabled) === filter.enabled);
        if (filter.category) out = out.filter((x) => x.category === filter.category);
        return out;
      })
    );
  }

  listClaims(filter: ClaimFilter = {}): Observable<BenefitClaim[]> {
    return this.claims$().pipe(
      map((rows) => {
        let out = rows;
        const q = (filter.q ?? '').trim().toLowerCase();
        if (q) out = out.filter((x) => x.employeeName.toLowerCase().includes(q) || x.planName.toLowerCase().includes(q));
        if (filter.status) out = out.filter((x) => x.status === filter.status);
        return out;
      })
    );
  }

  createPlan(input: Omit<BenefitPlan, 'id'>): Observable<BenefitPlan> {
    return this.http.post<BenefitPlan>(`${environment.apiBaseUrl}/benefits/plans`, input);
  }

  setClaimStatus(id0: string, status: BenefitClaimStatus): Observable<{ ok: boolean }> {
    return this.http.patch<{ ok: boolean }>(`${environment.apiBaseUrl}/benefits/claims/${id0}/status`, { status });
  }
}
