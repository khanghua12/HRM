import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import {
  Bell,
  Briefcase,
  ChartColumn,
  CircleEllipsis,
  ClipboardList,
  FileText,
  GraduationCap,
  Info,
  LogIn,
  LogOut,
  LucideAngularModule,
  Printer,
  Search,
  Settings,
  ShieldCheck,
  Users,
  Wallet
} from 'lucide-angular';
import { appRoutes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(
      LucideAngularModule.pick({
        Bell,
        Briefcase,
        ChartColumn,
        CircleEllipsis,
        ClipboardList,
        FileText,
        GraduationCap,
        Info,
        LogIn,
        LogOut,
        Printer,
        Search,
        Settings,
        ShieldCheck,
        Users,
        Wallet
      })
    ),
    provideCharts(withDefaultRegisterables()),
    provideRouter(appRoutes),
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};
