import { Injectable } from '@angular/core';
import { PayrollCalculationResult } from '../../models/payroll.model';

interface TaxBracket {
  cap: number;
  rate: number;
}

@Injectable({ providedIn: 'root' })
export class PayrollService {
  private readonly insuranceRates = {
    bhxh: 0.08,
    bhyt: 0.015,
    bhtn: 0.01
  };

  private readonly progressiveTaxBrackets: TaxBracket[] = [
    { cap: 5_000_000, rate: 0.05 },
    { cap: 10_000_000, rate: 0.1 },
    { cap: 18_000_000, rate: 0.15 },
    { cap: 32_000_000, rate: 0.2 },
    { cap: 52_000_000, rate: 0.25 },
    { cap: 80_000_000, rate: 0.3 },
    { cap: Number.POSITIVE_INFINITY, rate: 0.35 }
  ];

  calculateNetSalary(grossSalary: number): PayrollCalculationResult {
    const bhxh = grossSalary * this.insuranceRates.bhxh;
    const bhyt = grossSalary * this.insuranceRates.bhyt;
    const bhtn = grossSalary * this.insuranceRates.bhtn;
    const insuranceTotal = bhxh + bhyt + bhtn;
    const taxableIncome = Math.max(0, grossSalary - insuranceTotal);
    const personalIncomeTax = this.calculatePit(taxableIncome);
    const netSalary = grossSalary - insuranceTotal - personalIncomeTax;

    return {
      grossSalary,
      taxableIncome,
      insurance: {
        bhxh,
        bhyt,
        bhtn,
        total: insuranceTotal
      },
      personalIncomeTax,
      netSalary
    };
  }

  private calculatePit(taxableIncome: number): number {
    let remaining = taxableIncome;
    let lowerBound = 0;
    let tax = 0;

    for (const bracket of this.progressiveTaxBrackets) {
      if (remaining <= 0) {
        break;
      }

      const taxableAtBracket = Math.min(remaining, bracket.cap - lowerBound);
      tax += taxableAtBracket * bracket.rate;
      remaining -= taxableAtBracket;
      lowerBound = bracket.cap;
    }

    return tax;
  }
}
