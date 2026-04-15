import { Routes } from '@angular/router';
import { PayrollListComponent } from './pages/payroll-list/payroll-list.component';
import { PayrollDetailComponent } from './pages/payroll-detail/payroll-detail.component';

export const PAYROLL_ROUTES: Routes = [
  { path: '', component: PayrollListComponent },
  { path: ':id', component: PayrollDetailComponent }
];
