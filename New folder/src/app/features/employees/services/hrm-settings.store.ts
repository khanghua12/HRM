import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { DepartmentSetting, TitleSetting, WorkplaceSetting } from '../models/hrm-settings.model';

@Injectable({ providedIn: 'root' })
export class HrmSettingsStore {
  private readonly http = inject(HttpClient);

  readonly titles$ = this.http.get<TitleSetting[]>(`${environment.apiBaseUrl}/settings/titles`);
  readonly workplaces$ = this.http.get<WorkplaceSetting[]>(`${environment.apiBaseUrl}/settings/workplaces`);

  listDepartments(q: string): Observable<DepartmentSetting[]> {
    const params = q.trim() ? { q: q.trim() } : {};
    return this.http.get<DepartmentSetting[]>(`${environment.apiBaseUrl}/settings/departments`, { params });
  }

  addDepartment(input: Omit<DepartmentSetting, 'id'>): Observable<DepartmentSetting> {
    return this.http.post<DepartmentSetting>(`${environment.apiBaseUrl}/settings/departments`, input);
  }

  toggleDepartment(id0: string): Observable<{ ok: boolean }> {
    return this.http.patch<{ ok: boolean }>(`${environment.apiBaseUrl}/settings/departments/${id0}/toggle`, {});
  }

  addTitle(input: Omit<TitleSetting, 'id'>): Observable<TitleSetting> {
    return this.http.post<TitleSetting>(`${environment.apiBaseUrl}/settings/titles`, input);
  }

  toggleTitle(id0: string): Observable<{ ok: boolean }> {
    return this.http.patch<{ ok: boolean }>(`${environment.apiBaseUrl}/settings/titles/${id0}/toggle`, {});
  }

  addWorkplace(input: Omit<WorkplaceSetting, 'id'>): Observable<WorkplaceSetting> {
    return this.http.post<WorkplaceSetting>(`${environment.apiBaseUrl}/settings/workplaces`, input);
  }

  toggleWorkplace(id0: string): Observable<{ ok: boolean }> {
    return this.http.patch<{ ok: boolean }>(`${environment.apiBaseUrl}/settings/workplaces/${id0}/toggle`, {});
  }
}
