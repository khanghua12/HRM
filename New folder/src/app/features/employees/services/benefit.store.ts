import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, of } from 'rxjs';
import type { BenefitCategory, BenefitClaim, BenefitClaimStatus, BenefitPlan } from '../models/benefit.model';

type PlanFilter = { enabled?: boolean | null; category?: BenefitCategory | '' };
type ClaimFilter = { q?: string; status?: BenefitClaimStatus | '' };

@Injectable({ providedIn: 'root' })
export class BenefitStore {
  private readonly _plans$ = new BehaviorSubject<BenefitPlan[]>(seedPlans());
  private readonly _claims$ = new BehaviorSubject<BenefitClaim[]>(seedClaims());

  readonly plans$ = this._plans$.asObservable();
  readonly claims$ = this._claims$.asObservable();

  listPlans(filter: PlanFilter = {}): Observable<BenefitPlan[]> {
    return this.plans$.pipe(
      map((rows) => {
        let out = rows;
        if (filter.enabled != null) out = out.filter((x) => x.enabled === filter.enabled);
        if (filter.category) out = out.filter((x) => x.category === filter.category);
        return out;
      })
    );
  }

  listClaims(filter: ClaimFilter = {}): Observable<BenefitClaim[]> {
    return this.claims$.pipe(
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
    const plan: BenefitPlan = { ...input, id: id() };
    this._plans$.next([plan, ...this._plans$.value]);
    return of(plan);
  }

  setClaimStatus(id0: string, status: BenefitClaimStatus): void {
    this._claims$.next(this._claims$.value.map((x) => (x.id === id0 ? { ...x, status } : x)));
  }
}

function seedPlans(): BenefitPlan[] {
  return [
    { id: 'BEN-001', name: 'Bảo hiểm sức khoẻ mở rộng', category: 'health', monthlyBudget: 350000000, enabled: true },
    { id: 'BEN-002', name: 'Phụ cấp ăn trưa', category: 'meal', monthlyBudget: 120000000, enabled: true },
    { id: 'BEN-003', name: 'Phụ cấp đi lại', category: 'allowance', monthlyBudget: 80000000, enabled: false }
  ];
}

function seedClaims(): BenefitClaim[] {
  const now = Date.now();
  return [
    {
      id: 'CLM-001',
      employeeId: 'EMP-001',
      employeeName: 'Nhân viên 1',
      planId: 'BEN-001',
      planName: 'Bảo hiểm sức khoẻ mở rộng',
      amount: 2500000,
      submittedAt: new Date(now - 86400000 * 3).toISOString(),
      status: 'processing'
    },
    {
      id: 'CLM-002',
      employeeId: 'EMP-009',
      employeeName: 'Nhân viên 9',
      planId: 'BEN-002',
      planName: 'Phụ cấp ăn trưa',
      amount: 720000,
      submittedAt: new Date(now - 86400000 * 10).toISOString(),
      status: 'paid'
    }
  ];
}

function id(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `ID-${Date.now()}`;
}

