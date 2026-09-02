import { Injectable, computed, inject, signal } from '@angular/core';
import { tap } from 'rxjs';
import { Api } from './api';
import { API } from './api.endpoints';
import { AuthResponse, AuthRestaurant, AuthUser, RegisterPayload } from '../models/auth';

const STORAGE_KEY = 'pidedeuna_auth';

interface StoredAuth {
  token: string;
  user: AuthUser;
  restaurant: AuthRestaurant | null;
}

@Injectable({ providedIn: 'root' })
export class Auth {
  private api = inject(Api);

  private readonly _token = signal<string | null>(null);
  private readonly _user = signal<AuthUser | null>(null);
  private readonly _restaurant = signal<AuthRestaurant | null>(null);

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  readonly restaurant = this._restaurant.asReadonly();
  readonly isAuthenticated = computed(() => this._token() !== null);

  constructor() {
    this.restoreFromStorage();
  }

  /** POST /auth/login — login único (staff o SUPER_ADMIN), sin slug. */
  login(email: string, password: string) {
    return this.api.post<AuthResponse>(API.AUTH.LOGIN, { email, password }).pipe(tap((res) => this.persist(res)));
  }

  /** POST /restaurantes/register — crea el restaurante + su primer admin, y loguea de una. */
  register(payload: RegisterPayload) {
    return this.api
      .post<AuthResponse>(API.AUTH.REGISTER, payload)
      .pipe(tap((res) => this.persist(res)));
  }

  logout(): void {
    this._token.set(null);
    this._user.set(null);
    this._restaurant.set(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  hasRole(...roles: string[]): boolean {
    const current = this._user();
    if (!current) return false;
    return current.roles.some((r) => roles.includes(r));
  }

  private persist(res: AuthResponse): void {
    this._token.set(res.token);
    this._user.set(res.user);
    this._restaurant.set(res.restaurant ?? null);
    const stored: StoredAuth = { token: res.token, user: res.user, restaurant: res.restaurant ?? null };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  }

  private restoreFromStorage(): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const stored: StoredAuth = JSON.parse(raw);
      this._token.set(stored.token);
      this._user.set(stored.user);
      this._restaurant.set(stored.restaurant);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}
