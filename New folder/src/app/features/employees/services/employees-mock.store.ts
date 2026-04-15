import { Injectable, computed, signal } from '@angular/core';
import { BehaviorSubject, Observable, map, of } from 'rxjs';
import type { EmployeeDetail } from '../models/employee-detail.model';
import type { EmployeeStatus, EmployeeSummary } from '../models/employee-summary.model';

type EmployeeFilter = {
  status?: EmployeeStatus | '';
};

@Injectable({ providedIn: 'root' })
export class EmployeesMockStore {
  private readonly _employees$ = new BehaviorSubject<EmployeeSummary[]>(seedEmployees());
  private readonly _selectedEmployeeId = signal<string | null>(null);

  readonly employees$ = this._employees$.asObservable();

  readonly employees = signal<EmployeeSummary[]>(this._employees$.value);
  readonly total = computed(() => this.employees().length);

  setSelectedEmployee(id: string | null): void {
    this._selectedEmployeeId.set(id);
  }

  list(filter: EmployeeFilter = {}): Observable<EmployeeSummary[]> {
    return this.employees$.pipe(
      map((list) => {
        const status = filter.status ?? '';
        if (!status) return list;
        return list.filter((e) => e.status === status);
      })
    );
  }

  getDetail(id: string): Observable<EmployeeDetail | null> {
    const base = this._employees$.value.find((e) => e.id === id);
    if (!base) return of(null);
    const detail: EmployeeDetail = {
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
      workEmail: `${slug(base.fullName)}@company.vn`,
      timekeepingCode: base.code.replace('NV', 'CC'),
      workplace: 'Văn phòng A',
      contractType: 'Xác định thời hạn',
      contractNumber: `HD-${base.code}`,
      username: slug(base.fullName),
      appointedAt: null,
      reappointedAt: null,
      joinedOrgAt: isoDaysAgo(90),
      traineeStartAt: base.status === 'trainee' ? isoDaysAgo(30) : null,
      internStartAt: base.status === 'intern' ? isoDaysAgo(45) : null,
      internEndAt: base.status === 'intern' ? isoDaysAgo(5) : null,
      probationStartAt: base.status === 'probation' ? isoDaysAgo(60) : null,
      probationEndAt: base.status === 'probation' ? isoDaysAgo(15) : null,
      officialAt: base.status === 'active' ? isoDaysAgo(120) : null,
      leaveApprovalAt: null,
      socialInsuranceStartAt: base.status === 'active' ? isoDaysAgo(110) : null,
      directManagerId: 'MGR-001',
      directManagerName: 'Lê Hoàng',
      hazardousWorkPosition: 'Không'
    };
    return of(detail);
  }

  searchManagers(query: string): Observable<Array<{ id: string; name: string }>> {
    const q = query.trim().toLowerCase();
    const managers = [
      { id: 'MGR-001', name: 'Lê Hoàng' },
      { id: 'MGR-002', name: 'Nguyễn Thảo' },
      { id: 'MGR-003', name: 'Trần Minh' }
    ];
    if (!q) return of(managers);
    return of(managers.filter((m) => m.name.toLowerCase().includes(q)));
  }
}

function seedEmployees(): EmployeeSummary[] {
  const now = new Date();
  const mk = (n: number) => new Date(now.getTime() - n * 86400000).toISOString();
  const employees: EmployeeSummary[] = [];
  const statuses: EmployeeStatus[] = ['active', 'probation', 'intern', 'trainee', 'onboarding', 'inactive'];
  const departments = ['Phòng ban A', 'Phòng ban B', 'Phòng ban C'];
  const titles = [
    'Chuyên viên kỹ thuật bậc 1',
    'Chuyên viên kỹ thuật bậc 2',
    'Chuyên viên',
    'Nhà quản lý',
    'Kỹ thuật viên VT1'
  ];
  const education: EmployeeSummary['educationLevel'][] = ['Trung cấp', 'Cao đẳng', 'Đại học', 'Sau đại học', 'Khác'];
  const objectTypes: EmployeeSummary['objectType'][] = [
    'Chuyên môn',
    'Công tác viên',
    'Thực tập sinh',
    'Học viên',
    'Viên chức'
  ];
  const genders: EmployeeSummary['gender'][] = ['male', 'female', 'other'];

  for (let i = 1; i <= 44; i++) {
    const status = statuses[i % statuses.length];
    employees.push({
      id: `EMP-${String(i).padStart(3, '0')}`,
      code: `NV${String(i).padStart(3, '0')}`,
      fullName: `Nhân viên ${i}`,
      department: departments[i % departments.length],
      title: titles[i % titles.length],
      status,
      gender: genders[i % genders.length],
      age: 20 + (i % 25),
      educationLevel: education[i % education.length],
      objectType: objectTypes[i % objectTypes.length],
      createdAt: mk(i)
    });
  }
  return employees;
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');
}

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
}

