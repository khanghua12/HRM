import { Injectable } from '@angular/core';
import { KpiMetric, KpiResult, KpiEvaluation } from '../../models/performance.model';

@Injectable({ providedIn: 'root' })
export class KpiService {
  calculateWeightedScore(metrics: KpiMetric[]): KpiResult {
    const totalWeight = metrics.reduce((sum, metric) => sum + metric.weight, 0);
    if (totalWeight === 0) {
      return { weightedScore: 0, metrics };
    }

    const score = metrics.reduce((sum, metric) => sum + metric.score * (metric.weight / totalWeight), 0);
    return { weightedScore: Number(score.toFixed(2)), metrics };
  }

  calculateCombinedScore(payrollMetrics: KpiMetric[], workMetrics: KpiMetric[]): KpiResult {
    const payroll = this.calculateWeightedScore(payrollMetrics).weightedScore;
    const work = this.calculateWeightedScore(workMetrics).weightedScore;
    const combined = payroll * 0.45 + work * 0.55;
    return {
      weightedScore: Number(combined.toFixed(2)),
      metrics: [...payrollMetrics, ...workMetrics]
    };
  }

  buildEvaluation(employeeId: string, employeeName: string, period: string, payrollScore: number, workScore: number, note = ''): KpiEvaluation {
    const finalScore = Number((payrollScore * 0.45 + workScore * 0.55).toFixed(2));
    return {
      employeeId,
      employeeName,
      period,
      payrollScore,
      workScore,
      finalScore,
      status: finalScore >= 75 ? 'Đạt' : 'Không đạt',
      note
    };
  }
}
