import { Routes } from '@angular/router';
import { TasksHomeComponent } from './pages/tasks-home/tasks-home.component';

export const TASKS_ROUTES: Routes = [
  { path: '', component: TasksHomeComponent },
  { path: ':id', component: TasksHomeComponent }
];
