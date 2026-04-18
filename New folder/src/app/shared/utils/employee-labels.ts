import type { Employee } from '../../models/employee.model';

export function employeeStatusVi(status: Employee['status']): string {
  const map: Record<Employee['status'], string> = {
    active: 'Đang làm việc',
    onboarding: 'Đang onboard',
    probation: 'Thử việc',
    intern: 'Thực tập',
    trainee: 'Học việc',
    inactive: 'Nghỉ việc'
  };
  return map[status] ?? status;
}
