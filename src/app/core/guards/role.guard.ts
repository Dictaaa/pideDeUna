import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { RoleCode } from '../models/common.model';

/**
 * Variádico — úsalo como roleGuard('RESTAURANT_ADMIN', 'WAITER').
 * SUPER_ADMIN siempre pasa sin importar qué roles pidas (mismo
 * criterio que requireSameRestaurant en el backend).
 */
export function roleGuard(...allowedRoles: RoleCode[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    const roles = auth.currentRoles;
    const hasAccess = roles.includes('SUPER_ADMIN') || roles.some((r) => allowedRoles.includes(r));

    if (hasAccess) return true;

    router.navigate(['/forbidden']);
    return false;
  };
}