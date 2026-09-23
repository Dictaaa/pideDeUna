import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/** Exige un JWT presente y sin expirar. No distingue roles — eso es roleGuard. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn && !auth.isTokenExpired()) return true;

  auth.logout();
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

/** Lo opuesto: para /login — si ya está logueado, no tiene sentido que vea el form. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn || auth.isTokenExpired()) return true;

  router.navigate(['/']);
  return false;
};