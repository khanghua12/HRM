import { Injectable } from '@angular/core';
import { Employee } from '../models/payroll-employee.model';
import { Payroll } from '../models/payroll-record.model';

@Injectable({ providedIn: 'root' })
export class EmailService {
  sendPayrollEmail(employee: Employee, payroll: Payroll): void {
    // Giả lập gửi mail — production sẽ gọi API
    // eslint-disable-next-line no-console
    console.log('[EmailService] Gui phieu luong', {
      to: employee.email,
      employeeCode: employee.code,
      gross: payroll.grossSalary,
      net: payroll.netSalary
    });
  }
}
