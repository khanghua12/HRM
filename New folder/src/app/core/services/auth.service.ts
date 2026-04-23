import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

const STORAGE_KEY = 'hrm_auth_session';

export type MenuKey = 'employees' | 'recruitment' | 'payroll' | 'performance' | 'work' | 'training' | 'forms';

const ALL_MENUS: MenuKey[] = ['employees', 'recruitment', 'payroll', 'performance', 'work', 'training', 'forms'];

export interface AuthSession {
  token: string;
  displayName: string;
  email: string;
  menuPermissions: MenuKey[];
}

interface LoginResponse {
  token: string;
  displayName: string;
  email: string;
  menuPermissions?: MenuKey[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly session = signal<AuthSession | null>(null);

  readonly isAuthenticated = computed(() => !!this.session()?.token);
  readonly displayName = computed(() => this.session()?.displayName ?? '');
  readonly email = computed(() => this.session()?.email ?? '');
  readonly menuPermissions = computed<MenuKey[]>(() => this.session()?.menuPermissions ?? []);

  constructor() {
    this.restoreSession();
  }

  private restoreSession(): void {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as Partial<AuthSession>;
      if (parsed?.token && parsed?.displayName && parsed?.email) {
        const permissions = (parsed.menuPermissions?.length ? parsed.menuPermissions : ALL_MENUS).filter(isMenuKey);
        this.session.set({
          token: parsed.token,
          displayName: parsed.displayName,
          email: parsed.email,
          menuPermissions: permissions.length > 0 ? permissions : ALL_MENUS
        });
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }

  getToken(): string | null {
    return this.session()?.token ?? null;
  }

  canAccessMenu(menu: MenuKey): boolean {
    const permissions = this.menuPermissions();
    return permissions.includes(menu);
  }

  async login(email: string, password: string): Promise<{ ok: true } | { ok: false; message: string }> {
    const trimmedEmail = email.trim().toLowerCase();

    try {
      const response = await firstValueFrom(
        this.http.post<LoginResponse>(`${environment.apiBaseUrl}/auth/login`, {
          email: trimmedEmail,
          password
        })
      );

      const permissions = (response.menuPermissions?.length ? response.menuPermissions : ALL_MENUS).filter(isMenuKey);

      const next: AuthSession = {
        token: response.token,
        displayName: response.displayName,
        email: response.email,
        menuPermissions: permissions.length > 0 ? permissions : ['employees']
      };

      this.session.set(next);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return { ok: true };
    } catch {
      return { ok: false, message: 'Tài khoản chưa được tạo hoặc thông tin đăng nhập không đúng.' };
    }
  }

  logout(): void {
    this.session.set(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

function isMenuKey(value: string): value is MenuKey {
  return ['employees', 'recruitment', 'payroll', 'performance', 'work', 'training', 'forms'].includes(value);
}
