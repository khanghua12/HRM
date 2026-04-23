import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, combineLatest, map, of, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
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
  private readonly http = inject(HttpClient);
  private readonly _refresh$ = new BehaviorSubject<void>(undefined);
  private readonly _googleSheetConfig$ = new BehaviorSubject<GoogleSheetConfig>({ sheetId: '', range: 'Form Responses 1!A2:H', apiKey: '' });
  private readonly _syncRuns$ = new BehaviorSubject<SyncRun[]>([]);
  private readonly _fbPosts$ = new BehaviorSubject<FacebookPostItem[]>([]);

  readonly candidates$ = this._refresh$.pipe(
    switchMap(() => this.http.get<any[]>(`${environment.apiBaseUrl}/recruitment/candidates`)),
    map((rows) => rows.map((r) => ({ ...r, cvUrl: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf', cvFileName: `${r.fullName || 'candidate'}-cv.pdf` } as DigitalCandidate)))
  );

  readonly jobs$ = this._refresh$.pipe(switchMap(() => this.http.get<JobPosting[]>(`${environment.apiBaseUrl}/recruitment/jobs`)));
  readonly googleSheetConfig$ = this._googleSheetConfig$.asObservable();
  readonly syncRuns$ = this._syncRuns$.asObservable();
  readonly fbPosts$ = this._fbPosts$.asObservable();

  readonly stageStats$ = this.candidates$.pipe(
    map((rows) => {
      const stages: CandidateStage[] = ['sourcing', 'screening', 'interview', 'offer', 'hired', 'rejected'];
      return stages.map((s) => ({ stage: s, count: rows.filter((r) => r.stage === s).length }));
    })
  );

  readonly sourceStats$ = this.candidates$.pipe(
    map((rows) => {
      const sources: CandidateSource[] = ['google-form', 'linkedin', 'facebook', 'referral', 'other'];
      return sources.map((s) => ({ source: s, count: rows.filter((r) => r.source === s).length }));
    })
  );

  readonly monthlyApplicantStats$ = this.candidates$.pipe(
    map((rows) => {
      const buckets = new Map<string, number>();
      for (const row of rows) {
        const key = String(row.appliedAt || '').slice(0, 7);
        buckets.set(key, (buckets.get(key) ?? 0) + 1);
      }
      return Array.from(buckets.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => ({ month, count }));
    })
  );

  listCandidates(filter: { q?: string; stage?: CandidateStage | ''; page: number; pageSize: number }): Observable<{ rows: DigitalCandidate[]; total: number }> {
    return this.candidates$.pipe(
      map((rows) => {
        let out = rows;
        const q = (filter.q ?? '').trim().toLowerCase();
        if (q) out = out.filter((r) => r.fullName.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.appliedRole.toLowerCase().includes(q));
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

  saveGoogleSheetConfig(config: GoogleSheetConfig): void { this._googleSheetConfig$.next(config); }

  runGoogleSheetSyncMock(): Observable<SyncRun> {
    const run: SyncRun = { id: id(), syncedAt: new Date().toISOString(), imported: 0, status: 'success', note: 'Đã đồng bộ dữ liệu từ DB.' };
    this._syncRuns$.next([run, ...this._syncRuns$.value]);
    this._refresh$.next();
    return of(run);
  }

  createFacebookPostFromJob(jobId: string): Observable<FacebookPostItem | null> {
    return this.jobs$.pipe(
      map((jobs) => jobs.find((j) => j.id === jobId) ?? null),
      map((job) => {
        if (!job) return null;
        const item: FacebookPostItem = { id: id(), jobId: job.id, jobTitle: job.title, content: `TUYEN DUNG ${job.title.toUpperCase()}`, scheduledAt: null, status: 'draft', createdAt: new Date().toISOString() };
        this._fbPosts$.next([item, ...this._fbPosts$.value]);
        return item;
      })
    );
  }

  queueFacebookPost(postId: string, scheduledAt: string): void { this._fbPosts$.next(this._fbPosts$.value.map((p) => p.id === postId ? { ...p, status: 'queued', scheduledAt } : p)); }
  markFacebookPublished(postId: string): void { this._fbPosts$.next(this._fbPosts$.value.map((p) => p.id === postId ? { ...p, status: 'published' } : p)); }

  dashboardKpis$(): Observable<{ totalCandidates: number; fromGoogleForm: number; openJobs: number; queuedPosts: number }> {
    return combineLatest([this.candidates$, this.jobs$, this.fbPosts$]).pipe(
      map(([candidates, jobs, posts]) => ({ totalCandidates: candidates.length, fromGoogleForm: candidates.filter((c) => c.source === 'google-form').length, openJobs: jobs.filter((j) => j.status === 'open').length, queuedPosts: posts.filter((p) => p.status === 'queued').length }))
    );
  }
}

function id(): string { return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `ID-${Date.now()}`; }
