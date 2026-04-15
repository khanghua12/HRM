export interface InsuranceBreakdown {
  bhxh: number;
  bhyt: number;
  bhtn: number;
  total: number;
}

export interface PayrollCalculationResult {
  grossSalary: number;
  taxableIncome: number;
  insurance: InsuranceBreakdown;
  personalIncomeTax: number;
  netSalary: number;
}

export interface PayrollRecord {
  employeeId: string;
  employeeName: string;
  grossSalary: number;
  period: string;
}
