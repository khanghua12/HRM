import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, map, of } from 'rxjs';
import type { Candidate, CandidateStage, JobPosting } from '../../../models/recruitment.model';

export type CandidateSource = 'google-form' | 'linkedin' | 'facebook' | 'referral' | 'other';
export type PublisherStatus = 'draft' | 'queued' | 'published' | 'failed';

export interface DigitalCandidate extends Candidate {
  phone: string;
  source: CandidateSource;
  appliedAt: string;
  city: string;
  yearsOfExperience: number;
  skills: string[];
  summary: string;
  cvUrl: string;
  cvFileName: string;
}

export interface GoogleSheetConfig {
  sheetId: string;
  range: string;
  apiKey: string;
}

export interface SyncRun {
  id: string;
  syncedAt: string;
  imported: number;
  status: 'success' | 'failed';
  note: string;
}

export interface FacebookPostItem {
  id: string;
  jobId: string;
  jobTitle: string;
  content: string;
  scheduledAt: string | null;
  status: PublisherStatus;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class RecruitmentDigitalStore {
  private readonly _candidates$ = new BehaviorSubject<DigitalCandidate[]>(seedCandidates());
  private readonly _jobs$ = new BehaviorSubject<JobPosting[]>(seedJobs());
  private readonly _googleSheetConfig$ = new BehaviorSubject<GoogleSheetConfig>({
    sheetId: '',
    range: 'Form Responses 1!A2:H',
    apiKey: ''
  });
  private readonly _syncRuns$ = new BehaviorSubject<SyncRun[]>([]);
  private readonly _fbPosts$ = new BehaviorSubject<FacebookPostItem[]>(seedPosts());

  readonly candidates$ = this._candidates$.asObservable();
  readonly jobs$ = this._jobs$.asObservable();
  readonly googleSheetConfig$ = this._googleSheetConfig$.asObservable();
  readonly syncRuns$ = this._syncRuns$.asObservable();
  readonly fbPosts$ = this._fbPosts$.asObservable();

  readonly stageStats$ = this.candidates$.pipe(
    map((rows) => {
      const stages: CandidateStage[] = ['sourcing', 'screening', 'interview', 'offer', 'hired', 'rejected'];
      return stages.map((s) => ({
        stage: s,
        count: rows.filter((r) => r.stage === s).length
      }));
    })
  );

  readonly sourceStats$ = this.candidates$.pipe(
    map((rows) => {
      const sources: CandidateSource[] = ['google-form', 'linkedin', 'facebook', 'referral', 'other'];
      return sources.map((s) => ({
        source: s,
        count: rows.filter((r) => r.source === s).length
      }));
    })
  );

  readonly monthlyApplicantStats$ = this.candidates$.pipe(
    map((rows) => {
      const buckets = new Map<string, number>();
      for (const row of rows) {
        const key = row.appliedAt.slice(0, 7);
        buckets.set(key, (buckets.get(key) ?? 0) + 1);
      }
      return Array.from(buckets.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => ({ month, count }));
    })
  );

  listCandidates(filter: { q?: string; stage?: CandidateStage | ''; page: number; pageSize: number }): Observable<{
    rows: DigitalCandidate[];
    total: number;
  }> {
    return this.candidates$.pipe(
      map((rows) => {
        let out = rows;
        const q = (filter.q ?? '').trim().toLowerCase();
        if (q) {
          out = out.filter(
            (r) =>
              r.fullName.toLowerCase().includes(q) ||
              r.email.toLowerCase().includes(q) ||
              r.appliedRole.toLowerCase().includes(q)
          );
        }
        if (filter.stage) out = out.filter((r) => r.stage === filter.stage);
        const total = out.length;
        const start = (filter.page - 1) * filter.pageSize;
        return { rows: out.slice(start, start + filter.pageSize), total };
      })
    );
  }

  getCandidateById(id0: string): Observable<DigitalCandidate | null> {
    return this.candidates$.pipe(map((rows) => rows.find((r) => r.id === id0) ?? null));
  }

  saveGoogleSheetConfig(config: GoogleSheetConfig): void {
    this._googleSheetConfig$.next(config);
  }

  runGoogleSheetSyncMock(): Observable<SyncRun> {
    const importedCandidates: DigitalCandidate[] = [
      {
        id: id(),
        fullName: 'Ứng viên từ Google Form',
        email: `form.${Date.now()}@gmail.com`,
        appliedRole: 'Frontend Developer',
        stage: 'screening',
        phone: '0909000111',
        source: 'google-form',
        appliedAt: new Date().toISOString(),
        city: 'TP.HCM',
        yearsOfExperience: 2,
        skills: ['Angular', 'TypeScript', 'Tailwind'],
        summary: 'Ứng viên gửi từ Google Form, đã đủ thông tin cơ bản.',
        cvUrl: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
        cvFileName: 'cv-google-form.pdf'
      }
    ];
    this._candidates$.next([...importedCandidates, ...this._candidates$.value]);

    const run: SyncRun = {
      id: id(),
      syncedAt: new Date().toISOString(),
      imported: importedCandidates.length,
      status: 'success',
      note: 'Mock sync từ Google Sheet thành công. BE sẽ thay bằng gọi API Sheets thật.'
    };
    this._syncRuns$.next([run, ...this._syncRuns$.value]);
    return of(run);
  }

  createFacebookPostFromJob(jobId: string): Observable<FacebookPostItem | null> {
    const job = this._jobs$.value.find((j) => j.id === jobId);
    if (!job) return of(null);
    const item: FacebookPostItem = {
      id: id(),
      jobId: job.id,
      jobTitle: job.title,
      content: buildFacebookContent(job),
      scheduledAt: null,
      status: 'draft',
      createdAt: new Date().toISOString()
    };
    this._fbPosts$.next([item, ...this._fbPosts$.value]);
    return of(item);
  }

  queueFacebookPost(postId: string, scheduledAt: string): void {
    this._fbPosts$.next(
      this._fbPosts$.value.map((p) => (p.id === postId ? { ...p, status: 'queued', scheduledAt } : p))
    );
  }

  markFacebookPublished(postId: string): void {
    this._fbPosts$.next(
      this._fbPosts$.value.map((p) => (p.id === postId ? { ...p, status: 'published' } : p))
    );
  }

  dashboardKpis$(): Observable<{
    totalCandidates: number;
    fromGoogleForm: number;
    openJobs: number;
    queuedPosts: number;
  }> {
    return combineLatest([this.candidates$, this.jobs$, this.fbPosts$]).pipe(
      map(([candidates, jobs, posts]) => ({
        totalCandidates: candidates.length,
        fromGoogleForm: candidates.filter((c) => c.source === 'google-form').length,
        openJobs: jobs.filter((j) => j.status === 'open').length,
        queuedPosts: posts.filter((p) => p.status === 'queued').length
      }))
    );
  }
}

function seedCandidates(): DigitalCandidate[] {
  return [
    {
      id: 'C-001',
      fullName: 'Nguyễn Gia Hân',
      email: 'han.nguyen@gmail.com',
      appliedRole: 'Frontend Developer',
      stage: 'interview',
      phone: '0901111111',
      source: 'google-form',
      appliedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      city: 'Hà Nội',
      yearsOfExperience: 3,
      skills: ['Angular', 'RxJS', 'NgRx'],
      summary: 'Đã từng làm hệ thống CRM nội bộ 3 năm.',
      cvUrl: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
      cvFileName: 'nguyen-gia-han-cv.pdf'
    },
    {
      id: 'C-002',
      fullName: 'Phạm Trí Đức',
      email: 'duc.pham@gmail.com',
      appliedRole: 'Backend Developer',
      stage: 'screening',
      phone: '0902222222',
      source: 'linkedin',
      appliedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      city: 'Đà Nẵng',
      yearsOfExperience: 4,
      skills: ['Node.js', 'NestJS', 'PostgreSQL'],
      summary: 'Kinh nghiệm backend và tích hợp API lớn.',
      cvUrl: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
      cvFileName: 'pham-tri-duc-cv.pdf'
    },
    {
      id: 'C-003',
      fullName: 'Lê Trần Anh',
      email: 'anh.le@gmail.com',
      appliedRole: 'QA Engineer',
      stage: 'offer',
      phone: '0903333333',
      source: 'facebook',
      appliedAt: new Date(Date.now() - 86400000 * 11).toISOString(),
      city: 'TP.HCM',
      yearsOfExperience: 2,
      skills: ['Testing', 'Cypress', 'Manual Test'],
      summary: 'Có kinh nghiệm QA web/mobile và viết testcase.',
      cvUrl: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
      cvFileName: 'le-tran-anh-cv.pdf'
    }
  ];
}

function seedJobs(): JobPosting[] {
  return [
    { id: 'J-001', title: 'Frontend Developer', department: 'Engineering', openings: 2, postedAt: '2026-04-01', status: 'open' },
    { id: 'J-002', title: 'Backend Developer', department: 'Engineering', openings: 1, postedAt: '2026-04-02', status: 'open' },
    { id: 'J-003', title: 'HR Executive', department: 'HR', openings: 1, postedAt: '2026-04-05', status: 'paused' }
  ];
}

function seedPosts(): FacebookPostItem[] {
  return [
    {
      id: 'P-001',
      jobId: 'J-001',
      jobTitle: 'Frontend Developer',
      content: 'We are hiring Frontend Developer! Apply now.',
      scheduledAt: new Date(Date.now() + 3600000).toISOString(),
      status: 'queued',
      createdAt: new Date().toISOString()
    }
  ];
}

function buildFacebookContent(job: JobPosting): string {
  return `TUYEN DUNG ${job.title.toUpperCase()}\nPhong ban: ${job.department}\nSo luong: ${job.openings}\nUng tuyen ngay qua Google Form cua cong ty.`;
}

function id(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `ID-${Date.now()}`;
}

