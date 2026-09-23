import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Decide qué hacer en la raíz '/'. Sin sesión → deja pasar (se ve el
 * Home público). Con sesión → nunca se ve el Home, se resuelve a
 * dónde mandar a cada quien. El JWT solo trae UUIDs de compañía/
 * sucursal, no slugs — por eso hace falta /auth/me para armar la URL.
 */
export const homeGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn || auth.isTokenExpired()) return true;

  if (auth.currentRoles.includes('SUPER_ADMIN')) {
    return router.createUrlTree(['/super-admin']);
  }

  return auth.loadMe().pipe(
    map((me) => {
      if (me.restaurant && me.company) {
        return router.createUrlTree(['/admin', me.company.slug, me.restaurant.slug]);
      }
      if (me.company) {
        // Dueño con varias sucursales, sin una fija — que elija en el panel de compañía.
        return router.createUrlTree(['/admin', me.company.slug]);
      }
      return router.createUrlTree(['/login']);
    })
  );
};