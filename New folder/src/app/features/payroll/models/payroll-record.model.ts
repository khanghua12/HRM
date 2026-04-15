import { Employee } from './payroll-employee.model';

/** Kết quả tính lương dùng cho UI / gửi mail (map từ PayrollService). */
export interface Payroll {
  grossSalary: number;
  insurance: {
    bhxh: number;
    bhyt: number;
    bhtn: number;
  };
  tax: number;
  netSalary: number;
}

/** Bản ghi mock: nhân viên + mức gross đầu vào. */
export interface PayrollEmployeeRecord {
  employee: Employee;
  grossSalary: number;
}
