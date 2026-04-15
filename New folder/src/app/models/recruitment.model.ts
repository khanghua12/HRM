export type CandidateStage = 'sourcing' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';

export interface JobPosting {
  id: string;
  title: string;
  department: string;
  openings: number;
  postedAt: string;
  status: 'open' | 'paused' | 'closed';
}

export interface Candidate {
  id: string;
  fullName: string;
  email: string;
  appliedRole: string;
  stage: CandidateStage;
}
