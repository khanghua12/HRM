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

export interface Evaluation360 {
  employeeId: string;
  reviewerName: string;
  comment: string;
  score: number;
}
