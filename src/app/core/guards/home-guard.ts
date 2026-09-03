import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';
import { landingPathFor } from '../../shared/utils/landing-path';

/**
 * Protege la ruta raíz ('/'): si hay sesión, no tiene sentido mostrar
 * el Home de mercadeo — manda directo a la pantalla que le toca a ese
 * rol (mismo criterio que usa login.ts justo después de autenticar).
 * Si no hay sesión, deja pasar y se ve el Home normal.
 */
export const homeGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (!auth.isAuthenticated()) return true;

  const slug = auth.restaurant()?.slug;
  if (slug) return router.createUrlTree(['/admin', slug, landingPathFor(auth.user()?.roles ?? [])]);

  if (auth.hasRole('SUPER_ADMIN')) return router.createUrlTree(['/super-admin', 'restaurantes']);

  return true;
};