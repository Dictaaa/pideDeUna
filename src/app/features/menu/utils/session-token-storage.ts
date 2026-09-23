// src/app/features/menu/utils/session-token-storage.ts
//
// Persiste el token de SESIÓN de mesa (no el mesaToken fijo del QR) en
// sessionStorage — a propósito NO localStorage: no debería sobrevivir
// más allá de esta pestaña/visita. Sirve para que OrderTracking pueda
// reconectarse por socket tras un reload sin volver a escanear el QR.
function key(companySlug: string, branchSlug: string): string {
  return `pdu_session_token:${companySlug}:${branchSlug}`;
}

export function saveSessionToken(companySlug: string, branchSlug: string, token: string): void {
  sessionStorage.setItem(key(companySlug, branchSlug), token);
}

export function getSessionToken(companySlug: string, branchSlug: string): string | null {
  return sessionStorage.getItem(key(companySlug, branchSlug));
}

export function clearSessionToken(companySlug: string, branchSlug: string): void {
  sessionStorage.removeItem(key(companySlug, branchSlug));
}