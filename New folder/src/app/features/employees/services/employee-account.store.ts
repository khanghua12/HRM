import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { MenuKey } from '../../../core/services/auth.service';

export interface EmployeeAccount {
  employeeId: string;
  email: string;
  username: string;
  password: string;
  active: boolean;
  menuPermissions: MenuKey[];
}

@Injectable({ providedIn: 'root' })
export class EmployeeAccountStore {
  private readonly http = inject(HttpClient);

  async getByEmployeeId(employeeId: string): Promise<EmployeeAccount | null> {
    try {
      return await firstValueFrom(
        this.http.get<EmployeeAccount>(`${environment.apiBaseUrl}/employees/${employeeId}/account`)
      );
    } catch {
      return null;
    }
  }

  async upsert(employeeId: string, input: Omit<EmployeeAccount, 'employeeId'>): Promise<EmployeeAccount> {
    return firstValueFrom(
      this.http.post<EmployeeAccount>(`${environment.apiBaseUrl}/employees/${employeeId}/account`, input)
    );
  }
}
