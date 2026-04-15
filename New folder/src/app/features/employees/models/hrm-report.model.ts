export type ReportKind = 'headcount' | 'turnover' | 'seniority' | 'gender' | 'recruitment' | 'payroll';

export interface HrmReportDefinition {
  id: string;
  name: string;
  kind: ReportKind;
  description: string;
  lastRunAt?: string | null; // ISO
}

