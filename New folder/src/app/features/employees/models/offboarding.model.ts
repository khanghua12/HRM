export type OffboardingStatus = 'initiated' | 'handover' | 'clearance' | 'completed' | 'cancelled';

export interface OffboardingCase {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  lastWorkingDate: string; // YYYY-MM-DD
  reason: 'resign' | 'terminate' | 'retire' | 'contract-end' | 'other';
  status: OffboardingStatus;
  handoverOwner?: string | null;
  createdAt: string; // ISO
}

