export type HrmDecisionType = 'transfer' | 'appoint' | 'discipline' | 'reward' | 'salary-adjustment';

export type HrmDecisionStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'effective';

export interface HrmDecision {
  id: string;
  code: string;
  type: HrmDecisionType;
  employeeId: string;
  employeeName: string;
  departmentFrom?: string | null;
  departmentTo?: string | null;
  titleFrom?: string | null;
  titleTo?: string | null;
  effectiveDate: string; // YYYY-MM-DD
  status: HrmDecisionStatus;
  createdAt: string; // ISO
  note?: string | null;
}

