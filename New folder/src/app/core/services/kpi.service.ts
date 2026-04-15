import { Injectable } from '@angular/core';
import { KpiMetric, KpiResult } from '../../models/performance.model';

@Injectable({ providedIn: 'root' })
export class KpiService {
  calculateWeightedScore(metrics: KpiMetric[]): KpiResult {
    const totalWeight = metrics.reduce((sum, metric) => sum + metric.weight, 0);
    if (totalWeight === 0) {
      return { weightedScore: 0, metrics };
    }

    const score = metrics.reduce((sum, metric) => {
      return sum + metric.score * (metric.weight / totalWeight);
    }, 0);

    return { weightedScore: Number(score.toFixed(2)), metrics };
  }
}
