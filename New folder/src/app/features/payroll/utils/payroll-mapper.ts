import { PayrollCalculationResult } from '../../../models/payroll.model';
import { Payroll } from '../models/payroll-record.model';

export function calculationResultToPayroll(result: PayrollCalculationResult): Payroll {
  return {
    grossSalary: result.grossSalary,
    insurance: {
      bhxh: result.insurance.bhxh,
      bhyt: result.insurance.bhyt,
      bhtn: result.insurance.bhtn
    },
    tax: result.personalIncomeTax,
    netSalary: result.netSalary
  };
}
