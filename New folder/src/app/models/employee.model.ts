export interface EmployeeDocument {
  id: string;
  name: string;
  type: 'contract' | 'identity' | 'certificate' | 'other';
  uploadedAt: string;
}

export interface Employee {
  id: string;
  code: string;
  fullName: string;
  email: string;
  phone: string;
  department: string;
  title: string;
  status: 'active' | 'onboarding' | 'probation' | 'intern' | 'trainee' | 'inactive';
  documents: EmployeeDocument[];
}
