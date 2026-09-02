import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { Auth } from '../services/auth';

/**
 * Agrega "Authorization: Bearer <token>" a toda petición saliente
 * (si hay sesión). Las rutas públicas del backend (menú, registro,
 * login) simplemente ignoran el header si no lo necesitan, así que
 * es seguro mandarlo siempre.
 * Si el backend responde 401 (token vencido/inválido), cierra la
 * sesión local y manda a /login — evita que la app se quede
 * mostrando pantallas con datos a medio cargar por un token muerto.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const router = inject(Router);

  const token = auth.token();
  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((err) => {
      if (err?.status === 401 && auth.isAuthenticated()) {
        auth.logout();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};