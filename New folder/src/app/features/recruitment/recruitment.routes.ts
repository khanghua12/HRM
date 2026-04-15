import { Routes } from '@angular/router';

export const RECRUITMENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/recruitment-shell/recruitment-shell.component').then((m) => m.RecruitmentShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/recruitment-dashboard/recruitment-dashboard.component').then(
            (m) => m.RecruitmentDashboardComponent
          )
      },
      {
        path: 'candidates',
        loadComponent: () =>
          import('./pages/recruitment-candidates/recruitment-candidates.component').then(
            (m) => m.RecruitmentCandidatesComponent
          )
      },
      {
        path: 'candidates/:id',
        loadComponent: () =>
          import('./pages/recruitment-candidate-detail/recruitment-candidate-detail.component').then(
            (m) => m.RecruitmentCandidateDetailComponent
          )
      },
      {
        path: 'integrations',
        loadComponent: () =>
          import('./pages/recruitment-integrations/recruitment-integrations.component').then(
            (m) => m.RecruitmentIntegrationsComponent
          )
      },
      {
        path: 'publisher',
        loadComponent: () =>
          import('./pages/recruitment-publisher/recruitment-publisher.component').then(
            (m) => m.RecruitmentPublisherComponent
          )
      }
    ]
  }
];
