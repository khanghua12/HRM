import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import type { EmployeeDetail } from '../models/employee-detail.model';
import type { EmployeeStatus, EmployeeSummary } from '../models/employee-summary.model';
import { environment } from '../../../../environments/environment';

type EmployeeFilter = {
  status?: EmployeeStatus | '';
  department?: string;
};

export type UpsertEmployeePayload = {
  fullName: string;
  department: string;
  title: string;
  status: EmployeeStatus;
  gender: 'male' | 'female' | 'other';
  age: number;
  educationLevel: 'Trung cấp' | 'Cao đẳng' | 'Đại học' | 'Sau đại học' | 'Khác';
  objectType: 'Chuyên môn' | 'Công tác viên' | 'Thực tập sinh' | 'Học viên' | 'Viên chức';
  email?: string;
  phone?: string;
};

@Injectable({ providedIn: 'root' })
export class EmployeesStore {
  private readonly http = inject(HttpClient);
  private readonly _selectedEmployeeId = signal<string | null>(null);
  readonly employees = signal<EmployeeSummary[]>([]);
  readonly total = computed(() => this.employees().length);

  setSelectedEmployee(id: string | null): void {
    this._selectedEmployeeId.set(id);
  }

  list(filter: EmployeeFilter = {}): Observable<EmployeeSummary[]> {
    const params: Record<string, string> = {};
    if (filter.status) params['status'] = filter.status;
    if (filter.department?.trim()) params['department'] = filter.department.trim();

    return this.http.get<EmployeeSummary[]>(`${environment.apiBaseUrl}/employees`, { params }).pipe(
      map((rows) => {
        this.employees.set(rows);
        return rows;
      })
    );
  }

  getDetail(id: string): Observable<EmployeeDetail | null> {
    if (!id || id === 'new') {
      return new Observable((subscriber) => {
        subscriber.next(null);
        subscriber.complete();
      });
    }

    return this.http.get<any>(`${environment.apiBaseUrl}/employees/${id}`).pipe(
      map((base) => ({
        id: base.id,
        code: base.code,
        fullName: base.fullName,
        department: base.department,
        title: base.title,
        position: 'Chuyên viên',
        positionGroup: 'Nhóm vị trí làm việc',
        professionalLevel: 'Cấp 1',
        classification: base.status,
        seniority: base.age >= 30 ? '3 năm' : '1 năm',
        workEmail: base.email || '',
        timekeepingCode: base.code?.replace('NV', 'CC') || '',
        workplace: 'Văn phòng A',
        contractType: 'Xác định thời hạn',
        contractNumber: `HD-${base.code || ''}`,
        username: base.code?.toLowerCase() || '',
        appointedAt: null,
        reappointedAt: null,
        joinedOrgAt: null,
        traineeStartAt: null,
        internStartAt: null,
        internEndAt: null,
        probationStartAt: null,
        probationEndAt: null,
        officialAt: null,
        leaveApprovalAt: null,
        socialInsuranceStartAt: null,
        directManagerId: null,
        directManagerName: null,
        hazardousWorkPosition: null
      }))
    );
  }

  createEmployee(payload: UpsertEmployeePayload): Observable<EmployeeSummary> {
    return this.http.post<EmployeeSummary>(`${environment.apiBaseUrl}/employees`, payload);
  }

  updateEmployee(id: string, payload: UpsertEmployeePayload): Observable<EmployeeSummary> {
    return this.http.put<EmployeeSummary>(`${environment.apiBaseUrl}/employees/${id}`, payload);
  }

  searchManagers(query: string): Observable<Array<{ id: string; name: string }>> {
    const params: Record<string, string> = {};
    if (query.trim()) params['q'] = query.trim();
    return this.http.get<Array<{ id: string; name: string }>>(`${environment.apiBaseUrl}/employees/managers`, {
      params
    });
  }
}
