import { PayrollEmployeeRecord } from '../models/payroll-record.model';

export const PAYROLL_EMPLOYEE_RECORDS: PayrollEmployeeRecord[] = [
  {
    employee: {
      id: 1,
      code: 'NV001',
      name: 'Nguyen Hoang Minh',
      department: 'Nhan su',
      position: 'HR Business Partner',
      email: 'minh.nh@company.vn',
      avatar: 'https://i.pravatar.cc/160?img=14'
    },
    grossSalary: 35_000_000
  },
  {
    employee: {
      id: 2,
      code: 'NV002',
      name: 'Tran Bao Chau',
      department: 'Ke toan',
      position: 'Payroll Specialist',
      email: 'chau.tb@company.vn',
      avatar: 'https://i.pravatar.cc/160?img=32'
    },
    grossSalary: 42_000_000
  },
  {
    employee: {
      id: 3,
      code: 'NV003',
      name: 'Le Quoc Anh',
      department: 'Cong nghe thong tin',
      position: 'Frontend Developer',
      email: 'anh.lq@company.vn',
      avatar: 'https://i.pravatar.cc/160?img=58'
    },
    grossSalary: 28_500_000
  },
  {
    employee: {
      id: 4,
      code: 'NV004',
      name: 'Pham Thi Mai',
      department: 'Van hanh',
      position: 'Operations Executive',
      email: 'mai.pt@company.vn',
      avatar: 'https://i.pravatar.cc/160?img=47'
    },
    grossSalary: 24_000_000
  },
  {
    employee: {
      id: 5,
      code: 'NV005',
      name: 'Do Tuan Kiet',
      department: 'Kinh doanh',
      position: 'Account Manager',
      email: 'kiet.dt@company.vn',
      avatar: 'https://i.pravatar.cc/160?img=12'
    },
    grossSalary: 55_000_000
  }
];
