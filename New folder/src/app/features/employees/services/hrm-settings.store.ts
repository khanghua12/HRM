import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, of } from 'rxjs';
import type { DepartmentSetting, TitleSetting, WorkplaceSetting } from '../models/hrm-settings.model';

@Injectable({ providedIn: 'root' })
export class HrmSettingsStore {
  private readonly _departments$ = new BehaviorSubject<DepartmentSetting[]>([
    { id: 'DEP-001', code: 'PB-A', name: 'Phòng ban A', active: true },
    { id: 'DEP-002', code: 'PB-B', name: 'Phòng ban B', active: true },
    { id: 'DEP-003', code: 'PB-C', name: 'Phòng ban C', active: false }
  ]);
  private readonly _titles$ = new BehaviorSubject<TitleSetting[]>([
    { id: 'TTL-001', name: 'Chuyên viên', active: true },
    { id: 'TTL-002', name: 'Tổ trưởng', active: true },
    { id: 'TTL-003', name: 'Quản lý', active: true }
  ]);
  private readonly _workplaces$ = new BehaviorSubject<WorkplaceSetting[]>([
    { id: 'WPL-001', name: 'Văn phòng A', active: true },
    { id: 'WPL-002', name: 'Văn phòng B', active: true }
  ]);

  readonly departments$ = this._departments$.asObservable();
  readonly titles$ = this._titles$.asObservable();
  readonly workplaces$ = this._workplaces$.asObservable();

  listDepartments(q: string): Observable<DepartmentSetting[]> {
    const needle = q.trim().toLowerCase();
    return this.departments$.pipe(
      map((rows) => (needle ? rows.filter((x) => x.name.toLowerCase().includes(needle) || x.code.toLowerCase().includes(needle)) : rows))
    );
  }

  addDepartment(input: Omit<DepartmentSetting, 'id'>): Observable<DepartmentSetting> {
    const item: DepartmentSetting = { ...input, id: id() };
    this._departments$.next([item, ...this._departments$.value]);
    return of(item);
  }

  toggleDepartment(id0: string): void {
    this._departments$.next(this._departments$.value.map((x) => (x.id === id0 ? { ...x, active: !x.active } : x)));
  }

  addTitle(input: Omit<TitleSetting, 'id'>): Observable<TitleSetting> {
    const item: TitleSetting = { ...input, id: id() };
    this._titles$.next([item, ...this._titles$.value]);
    return of(item);
  }

  toggleTitle(id0: string): void {
    this._titles$.next(this._titles$.value.map((x) => (x.id === id0 ? { ...x, active: !x.active } : x)));
  }

  addWorkplace(input: Omit<WorkplaceSetting, 'id'>): Observable<WorkplaceSetting> {
    const item: WorkplaceSetting = { ...input, id: id() };
    this._workplaces$.next([item, ...this._workplaces$.value]);
    return of(item);
  }

  toggleWorkplace(id0: string): void {
    this._workplaces$.next(this._workplaces$.value.map((x) => (x.id === id0 ? { ...x, active: !x.active } : x)));
  }
}

function id(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `ID-${Date.now()}`;
}

