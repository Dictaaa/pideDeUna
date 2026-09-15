/**
 * A qué pantalla debe aterrizar cada rol — la usan tanto el login
 * (a dónde mandar justo después de iniciar sesión) como role-guard
 * (a dónde mandar si alguien intenta entrar a una pantalla que no
 * le toca, en vez de mandarlo siempre a 'dashboard' — eso causaría
 * un loop infinito ahora que el dashboard es solo para admins).
 */
export function landingPathFor(roles: string[]): string {
  if (roles.includes('RESTAURANT_ADMIN') || roles.includes('SUPER_ADMIN')) return 'dashboard';
  if (roles.includes('WAITER')) return 'pedidos';
  if (roles.includes('CASHIER')) return 'pedidos';
  if (roles.includes('KITCHEN')) return 'cocina';
  return 'dashboard';
}