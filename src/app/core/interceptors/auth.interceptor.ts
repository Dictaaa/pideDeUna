// src/app/core/interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenStorageService } from '../services/token-storage.service';

/**
 * Interceptor funcional (estilo Angular 17+). Pega el JWT en TODAS
 * las requests salvo las que ya traigan su propio header explícito
 * (el flujo de cliente con X-Session-Token, o select-restaurant con
 * el preToken) — esas arman su Authorization/X-Session-Token a mano
 * en el propio servicio, así que este interceptor no debe pisarlas.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStorage = inject(TokenStorageService);
  const token = tokenStorage.getToken();

  if (!token || req.headers.has('Authorization') || req.headers.has('X-Session-Token')) {
    return next(req);
  }

  const cloned = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  return next(cloned);
};