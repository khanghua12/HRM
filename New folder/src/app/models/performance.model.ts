export interface KpiMetric {
  id: string;
  name: string;
  weight: number;
  score: number;
}

export interface KpiResult {
  weightedScore: number;
  metrics: KpiMetric[];
}

export interface KpiCategory {
  id: string;
  name: string;
  description: string;
  weight: number;
  threshold: number;
  isActive: boolean;
}

export interface KpiEvaluation {
  employeeId: string;
  employeeName: string;
  period: string;
  payrollScore: number;
  workScore: number;
  finalScore: number;
  status: 'Đạt' | 'Không đạt';
  note: string;
}

export interface Evaluation360 {
  employeeId: string;
  reviewerName: string;
  comment: string;
  score: number;
}
