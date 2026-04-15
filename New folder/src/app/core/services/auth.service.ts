import { Injectable, computed, signal } from '@angular/core';

const STORAGE_KEY = 'hrm_auth_session';

export interface AuthSession {
  token: string;
  displayName: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly session = signal<AuthSession | null>(null);

  readonly isAuthenticated = computed(() => !!this.session()?.token);
  readonly displayName = computed(() => this.session()?.displayName ?? '');
  readonly email = computed(() => this.session()?.email ?? '');

  constructor() {
    this.restoreSession();
  }

  private restoreSession(): void {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as AuthSession;
      if (parsed?.token && parsed?.displayName) {
        this.session.set(parsed);
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

  /**
   * Demo: admin@hrm.local / admin123
   */
  login(email: string, password: string): { ok: true } | { ok: false; message: string } {
    const trimmedEmail = email.trim().toLowerCase();
    if (trimmedEmail === 'admin@hrm.local' && password === 'admin123') {
      const next: AuthSession = {
        token: `demo-jwt-${Date.now()}`,
        displayName: 'Quản trị viên',
        email: trimmedEmail
      };
      this.session.set(next);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return { ok: true };
    }
    return { ok: false, message: 'Email hoặc mật khẩu không đúng.' };
  }

  logout(): void {
    this.session.set(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }
}
