import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, of } from 'rxjs';
import type { OffboardingCase, OffboardingStatus } from '../models/offboarding.model';

type OffboardingFilter = { q?: string; status?: OffboardingStatus | '' };

@Injectable({ providedIn: 'root' })
export class OffboardingStore {
  private readonly _items$ = new BehaviorSubject<OffboardingCase[]>(seed());
  readonly items$ = this._items$.asObservable();

  list(filter: OffboardingFilter = {}): Observable<OffboardingCase[]> {
    return this.items$.pipe(
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
    const item: OffboardingCase = { ...input, id: id(), createdAt: new Date().toISOString() };
    this._items$.next([item, ...this._items$.value]);
    return of(item);
  }

  updateStatus(id0: string, status: OffboardingStatus): void {
    this._items$.next(this._items$.value.map((x) => (x.id === id0 ? { ...x, status } : x)));
  }
}

function seed(): OffboardingCase[] {
  return [
    {
      id: 'OFF-001',
      employeeId: 'EMP-012',
      employeeName: 'Nhân viên 12',
      department: 'Phòng ban B',
      lastWorkingDate: isoPlus(12),
      reason: 'resign',
      status: 'handover',
      handoverOwner: 'Lê Hoàng',
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString()
    },
    {
      id: 'OFF-002',
      employeeId: 'EMP-020',
      employeeName: 'Nhân viên 20',
      department: 'Phòng ban A',
      lastWorkingDate: isoPlus(3),
      reason: 'contract-end',
      status: 'initiated',
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
    }
  ];
}

function isoPlus(days: number): string {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
}

function id(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `ID-${Date.now()}`;
}

