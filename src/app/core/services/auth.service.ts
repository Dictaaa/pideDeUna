// src/app/core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { API } from './api.endpoints';
import { TokenStorageService } from './token-storage.service';
import { RoleCode } from '../models/common.model';
import {
  LoginResponse, MeResponse, RequiresRestaurantSelectionResponse,
} from '../models/auth.model';

// El login puede devolver un token ya usable, o pedir que elijas
// sucursal (caso raro: roles en más de una sucursal a la vez).
export type LoginResult = LoginResponse | RequiresRestaurantSelectionResponse;

function isSelectionRequired(result: LoginResult): result is RequiresRestaurantSelectionResponse {
  return (result as RequiresRestaurantSelectionResponse).requiresRestaurantSelection === true;
}

// Forma exacta del payload que arma issueToken() en el backend.
export interface JwtPayload {
  sub: string;
  companyId: string | null;
  restaurantId: string | null;
  roles: RoleCode[];
  iat: number;
  exp: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private meSubject = new BehaviorSubject<MeResponse | null>(null);
  /** El estado de sesión actual — null hasta el primer loadMe() exitoso. */
  me$ = this.meSubject.asObservable();
  /** Igual que me$, como signal — para plantillas y componentes que no quieren un async pipe. */
  me = toSignal(this.me$, { initialValue: null });

  constructor(private http: HttpClient, private tokenStorage: TokenStorageService) {}

  get isLoggedIn(): boolean {
    return !!this.tokenStorage.getToken();
  }

  /**
   * Decodifica el JWT en el cliente (sin llamar al backend) — para los
   * guards, que necesitan responder sincrónicamente en cada navegación.
   * No es una verificación de seguridad (eso ya lo hace el backend en
   * cada request); es solo para decidir qué mostrar en el frontend.
   */
  getDecodedToken(): JwtPayload | null {
    const token = this.tokenStorage.getToken();
    if (!token) return null;
    try {
      return jwtDecode<JwtPayload>(token);
    } catch {
      return null;
    }
  }

  get currentRoles(): RoleCode[] {
    return this.getDecodedToken()?.roles ?? [];
  }

  /** true si el token es de un usuario con acceso a TODA la compañía (dueño), no fijo a una sucursal. */
  get isCompanyWideAccess(): boolean {
    const payload = this.getDecodedToken();
    return !!payload && payload.restaurantId === null && !payload.roles.includes('SUPER_ADMIN');
  }

  hasRole(...roles: RoleCode[]): boolean {
    const current = this.currentRoles;
    return current.includes('SUPER_ADMIN') || current.some((r) => roles.includes(r));
  }

  isTokenExpired(): boolean {
    const payload = this.getDecodedToken();
    if (!payload) return true;
    return Date.now() >= payload.exp * 1000;
  }

  loginAdmin(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(API.AUTH.LOGIN_ADMIN(), { email, password })
      .pipe(tap((res) => this.tokenStorage.setToken(res.token)));
  }

  login(email: string, password: string): Observable<LoginResult> {
    return this.http.post<LoginResult>(API.AUTH.LOGIN(), { email, password }).pipe(
      tap((res) => {
        if (isSelectionRequired(res)) {
          this.tokenStorage.setPreToken(res.preToken);
        } else {
          this.tokenStorage.setToken(res.token);
        }
      })
    );
  }

  /** Solo se llama cuando login() devolvió requiresRestaurantSelection. */
  selectRestaurant(restaurantId: string | null): Observable<LoginResponse> {
    const preToken = this.tokenStorage.getPreToken();
    return this.http
      .post<LoginResponse>(
        API.AUTH.SELECT_RESTAURANT(),
        { restaurantId },
        { headers: { Authorization: `Bearer ${preToken}` } }
      )
      .pipe(
        tap((res) => {
          this.tokenStorage.setToken(res.token);
          this.tokenStorage.clearPreToken();
        })
      );
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(API.AUTH.FORGOT_PASSWORD(), { email });
  }

  resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(API.AUTH.RESET_PASSWORD(), { token, newPassword });
  }

  /** Llamar al arrancar la app (si hay token) para hidratar el estado de sesión. */
  loadMe(): Observable<MeResponse> {
    return this.http.get<MeResponse>(API.AUTH.ME()).pipe(tap((res) => this.meSubject.next(res)));
  }

  logout(): void {
    this.tokenStorage.clearToken();
    this.tokenStorage.clearPreToken();
    this.meSubject.next(null);
  }
}