// src/app/shared/utils/landing-path.ts
import { RoleCode } from '../../core/models/common.model';

/** A qué pantalla de LA SUCURSAL mandar a cada rol justo después de loguearse. */
export function landingPathFor(roles: RoleCode[]): string {
  if (roles.includes('RESTAURANT_ADMIN')) return 'dashboard';
  if (roles.includes('CASHIER')) return 'caja';
  if (roles.includes('WAITER')) return 'pedidos';
  if (roles.includes('KITCHEN')) return 'cocina';
  return 'dashboard';
}