import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, of } from 'rxjs';
import type { HrmDecision, HrmDecisionStatus, HrmDecisionType } from '../models/hrm-decision.model';

type DecisionFilter = {
  q?: string;
  type?: HrmDecisionType | '';
  status?: HrmDecisionStatus | '';
};

@Injectable({ providedIn: 'root' })
export class HrmDecisionStore {
  private readonly _items$ = new BehaviorSubject<HrmDecision[]>(seed());
  readonly items$ = this._items$.asObservable();

  list(filter: DecisionFilter = {}): Observable<HrmDecision[]> {
    return this.items$.pipe(
      map((rows) => {
        let out = rows;
        const q = (filter.q ?? '').trim().toLowerCase();
        if (q) {
          out = out.filter(
            (x) =>
              x.code.toLowerCase().includes(q) ||
              x.employeeName.toLowerCase().includes(q) ||
              typeLabel(x.type).toLowerCase().includes(q)
          );
        }
        if (filter.type) out = out.filter((x) => x.type === filter.type);
        if (filter.status) out = out.filter((x) => x.status === filter.status);
        return out;
      })
    );
  }

  create(input: Omit<HrmDecision, 'id' | 'createdAt'>): Observable<HrmDecision> {
    const item: HrmDecision = {
      ...input,
      id: cryptoId(),
      createdAt: new Date().toISOString()
    };
    this._items$.next([item, ...this._items$.value]);
    return of(item);
  }

  updateStatus(id: string, status: HrmDecisionStatus): void {
    this._items$.next(this._items$.value.map((x) => (x.id === id ? { ...x, status } : x)));
  }
}

function seed(): HrmDecision[] {
  return [
    {
      id: 'DEC-001',
      code: 'QD-0001',
      type: 'transfer',
      employeeId: 'EMP-001',
      employeeName: 'Nhân viên 1',
      departmentFrom: 'Phòng ban A',
      departmentTo: 'Phòng ban B',
      titleFrom: 'Chuyên viên',
      titleTo: 'Chuyên viên',
      effectiveDate: isoPlus(5),
      status: 'pending',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      note: 'Điều động theo nhu cầu dự án.'
    },
    {
      id: 'DEC-002',
      code: 'QD-0002',
      type: 'appoint',
      employeeId: 'EMP-004',
      employeeName: 'Nhân viên 4',
      departmentFrom: 'Phòng ban A',
      departmentTo: 'Phòng ban A',
      titleFrom: 'Chuyên viên',
      titleTo: 'Tổ trưởng',
      effectiveDate: isoPlus(1),
      status: 'approved',
      createdAt: new Date(Date.now() - 86400000 * 6).toISOString()
    }
  ];
}

function typeLabel(t: HrmDecisionType): string {
  const m: Record<HrmDecisionType, string> = {
    transfer: 'Điều động',
    appoint: 'Bổ nhiệm',
    discipline: 'Kỷ luật',
    reward: 'Khen thưởng',
    'salary-adjustment': 'Điều chỉnh lương'
  };
  return m[t] ?? t;
}

function isoPlus(days: number): string {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
}

function cryptoId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `ID-${Date.now()}`;
}

