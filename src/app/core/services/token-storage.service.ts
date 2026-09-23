// src/app/core/services/token-storage.service.ts
import { Injectable } from '@angular/core';

const TOKEN_KEY = 'pdu_token';
const PRE_TOKEN_KEY = 'pdu_pre_token';

/**
 * Wrapper de localStorage — separado de AuthService para que cualquier
 * otro servicio (el interceptor, por ejemplo) pueda leer el token sin
 * crear una dependencia circular con AuthService.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  getPreToken(): string | null {
    return localStorage.getItem(PRE_TOKEN_KEY);
  }

  setPreToken(token: string): void {
    localStorage.setItem(PRE_TOKEN_KEY, token);
  }

  clearPreToken(): void {
    localStorage.removeItem(PRE_TOKEN_KEY);
  }
}