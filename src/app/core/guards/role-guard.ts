import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';
import { landingPathFor } from '../../shared/utils/landing-path';

export function roleGuard(...roles: string[]): CanActivateFn {
  return () => {
    const auth = inject(Auth);
    const router = inject(Router);

    if (auth.hasRole(...roles)) return true;

    const slug = auth.restaurant()?.slug;
    if (!slug) return router.createUrlTree(['/login']);

    return router.createUrlTree(['/admin', slug, landingPathFor(auth.user()?.roles ?? [])]);
  };
}