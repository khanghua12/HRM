export type BenefitCategory = 'insurance' | 'meal' | 'allowance' | 'health' | 'other';

export type BenefitClaimStatus = 'new' | 'processing' | 'approved' | 'rejected' | 'paid';

export interface BenefitPlan {
  id: string;
  name: string;
  category: BenefitCategory;
  monthlyBudget: number;
  enabled: boolean;
}

export interface BenefitClaim {
  id: string;
  employeeId: string;
  employeeName: string;
  planId: string;
  planName: string;
  amount: number;
  submittedAt: string; // ISO
  status: BenefitClaimStatus;
  note?: string | null;
}

