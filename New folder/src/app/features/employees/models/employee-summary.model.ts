export type EmployeeStatus =
  | 'active'
  | 'onboarding'
  | 'probation'
  | 'intern'
  | 'trainee'
  | 'inactive';

export interface EmployeeSummary {
  id: string;
  code: string;
  fullName: string;
  department: string;
  title: string;
  status: EmployeeStatus;
  gender: 'male' | 'female' | 'other';
  age: number;
  educationLevel: 'Trung cấp' | 'Cao đẳng' | 'Đại học' | 'Sau đại học' | 'Khác';
  objectType: 'Chuyên môn' | 'Công tác viên' | 'Thực tập sinh' | 'Học viên' | 'Viên chức';
  createdAt: string; // ISO date
}

