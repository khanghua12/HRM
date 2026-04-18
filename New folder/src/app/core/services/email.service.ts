import { Injectable } from '@angular/core';
import { PayrollCalculationResult, PayrollRecord } from '../../models/payroll.model';

@Injectable({ providedIn: 'root' })
export class EmailService {
  sendPayrollEmail(employee: PayrollRecord, payroll: PayrollCalculationResult): void {
    console.log('sendPayrollEmail', employee, payroll);
  }
}
