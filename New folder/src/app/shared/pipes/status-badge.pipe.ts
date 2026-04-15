import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'statusBadge',
  standalone: true
})
export class StatusBadgePipe implements PipeTransform {
  transform(value: string): string {
    const map: Record<string, string> = {
      active: 'bg-emerald-100 text-emerald-700',
      onboarding: 'bg-blue-100 text-blue-700',
      probation: 'bg-amber-100 text-amber-800',
      intern: 'bg-violet-100 text-violet-800',
      trainee: 'bg-cyan-100 text-cyan-800',
      inactive: 'bg-slate-200 text-slate-700',

      // HRM decisions
      draft: 'bg-slate-100 text-slate-700',
      pending: 'bg-amber-100 text-amber-800',
      approved: 'bg-emerald-100 text-emerald-700',
      effective: 'bg-indigo-100 text-indigo-700',
      open: 'bg-emerald-100 text-emerald-700',
      paused: 'bg-amber-100 text-amber-700',
      closed: 'bg-slate-200 text-slate-700',
      hired: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-rose-100 text-rose-700',

      // Benefits / claims
      new: 'bg-blue-100 text-blue-700',
      processing: 'bg-amber-100 text-amber-800',
      paid: 'bg-emerald-100 text-emerald-700',

      // Offboarding
      initiated: 'bg-blue-100 text-blue-700',
      handover: 'bg-amber-100 text-amber-800',
      clearance: 'bg-violet-100 text-violet-800',
      completed: 'bg-emerald-100 text-emerald-700',
      cancelled: 'bg-slate-200 text-slate-700'
    };

    return map[value] ?? 'bg-slate-100 text-slate-600';
  }
}
