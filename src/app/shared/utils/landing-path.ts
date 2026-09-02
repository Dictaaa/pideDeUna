export function landingPathFor(roles: string[]): string {
  if (roles.includes('RESTAURANT_ADMIN') || roles.includes('SUPER_ADMIN')) return 'dashboard';
  if (roles.includes('WAITER')) return 'pedidos';
  if (roles.includes('KITCHEN')) return 'cocina';
  return 'dashboard';
}