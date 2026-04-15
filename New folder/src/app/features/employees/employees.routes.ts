import { Routes } from '@angular/router';

export const EMPLOYEES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/employees-shell/employees-shell.component').then((m) => m.EmployeesShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'tong-quan' },
      {
        path: 'tong-quan',
        loadComponent: () =>
          import('./pages/hrm-dashboard/hrm-dashboard.component').then((m) => m.HrmDashboardComponent)
      },
      {
        path: 'ho-so',
        loadComponent: () =>
          import('./pages/employee-profiles/employee-profiles.component').then((m) => m.EmployeeProfilesComponent)
      },
      {
        path: 'ho-so/:id',
        loadComponent: () =>
          import('./pages/employee-detail-form/employee-detail-form.component').then(
            (m) => m.EmployeeDetailFormComponent
          )
      }
    ]
  }
];
