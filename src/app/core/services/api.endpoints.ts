// src/app/core/services/api.endpoints.ts
//
// Convención de rutas: TODO lo de nivel compañía cuelga de
// /:companySlug/..., y TODO lo de nivel sucursal cuelga de
// /:companySlug/:branchSlug/... anidado adentro. No hay un atajo tipo
// "/mine" resuelto por el JWT — siempre hay que pasar el slug en la URL.

import { environment } from '../../../environments/environment';

const BASE = environment.apiUrl;

export const API = {

  // ── Auth ─────────────────────────────────────────────────
  AUTH: {
    LOGIN_ADMIN: () => `${BASE}/auth/login-admin`,      // SUPER_ADMIN
    LOGIN: () => `${BASE}/auth/login`,                   // staff
    SELECT_RESTAURANT: () => `${BASE}/auth/select-restaurant`, // solo si login devolvió requiresRestaurantSelection
    FORGOT_PASSWORD: () => `${BASE}/auth/forgot-password`,
    RESET_PASSWORD: () => `${BASE}/auth/reset-password`,
    ME: () => `${BASE}/auth/me`,
  },

  // ── Catálogo global (sin slug) ────────────────────────────
  ROLES: {
    LIST: () => `${BASE}/roles`,
  },
  PERMISSIONS: {
    LIST: () => `${BASE}/permissions`,
  },
  ALLERGENS: {
    LIST: () => `${BASE}/allergens`,
    CREATE: () => `${BASE}/allergens`, // SUPER_ADMIN
  },
  PLANS: {
    LIST: () => `${BASE}/plans`,
    CREATE: () => `${BASE}/plans`,            // SUPER_ADMIN
    UPDATE: (id: string) => `${BASE}/plans/${id}`, // SUPER_ADMIN
  },

  // ── Panel SUPER_ADMIN (sin slug, ve toda la plataforma) ───
  COMPANIES_ADMIN: {
    LIST: () => `${BASE}/companies`,
    CREATE: () => `${BASE}/companies`,
    DETAIL: (id: string) => `${BASE}/companies/${id}`,
    UPDATE_STATUS: (id: string) => `${BASE}/companies/${id}/status`,
    CHANGE_PLAN: (id: string) => `${BASE}/companies/${id}/change-plan`,
    CREATE_ADMIN_USER: (id: string) => `${BASE}/companies/${id}/admin-user`,
  },
  RESTAURANTS_ADMIN: {
    LIST: () => `${BASE}/restaurants`,
  },

  // ── Compañía (todo cuelga de :companySlug) ─────────────────
  COMPANY: {
    PUBLIC_INFO: (companySlug: string) => `${BASE}/${companySlug}/public`, // sin JWT — marca + lista de sucursales
    DETAIL: (companySlug: string) => `${BASE}/${companySlug}`,
    UPDATE: (companySlug: string) => `${BASE}/${companySlug}`,
    GET_SETTINGS: (companySlug: string) => `${BASE}/${companySlug}/settings`,
    UPDATE_SETTINGS: (companySlug: string) => `${BASE}/${companySlug}/settings`,
    UPLOAD_LOGO: (companySlug: string) => `${BASE}/${companySlug}/logo`,
    STORAGE_USAGE: (companySlug: string) => `${BASE}/${companySlug}/storage-usage`,
    USAGE: (companySlug: string) => `${BASE}/${companySlug}/usage`,
    CHANGE_PLAN: (companySlug: string) => `${BASE}/${companySlug}/subscription/change-plan`,
  },

  // ── Sucursales (gestión desde la compañía) ────────────────
  COMPANY_RESTAURANTS: {
    LIST: (companySlug: string) => `${BASE}/${companySlug}/restaurants`,
    CREATE: (companySlug: string) => `${BASE}/${companySlug}/restaurants`,
  },

  // ── Usuarios y roles ───────────────────────────────────────
  USERS: {
    LIST: (companySlug: string) => `${BASE}/${companySlug}/users`,
    CREATE: (companySlug: string) => `${BASE}/${companySlug}/users`,
    UPDATE: (companySlug: string, userId: string) => `${BASE}/${companySlug}/users/${userId}`,
    REMOVE: (companySlug: string, userId: string) => `${BASE}/${companySlug}/users/${userId}`,
    ADD_ROLE: (companySlug: string, userId: string) => `${BASE}/${companySlug}/users/${userId}/roles`,
    REMOVE_ROLE: (companySlug: string, userId: string, userRoleId: string) =>
      `${BASE}/${companySlug}/users/${userId}/roles/${userRoleId}`,
    SET_PASSWORD: (companySlug: string, userId: string) => `${BASE}/${companySlug}/users/${userId}/password`, // admin resetea
  },

  // ── Auditoría ──────────────────────────────────────────────
  AUDIT_LOGS: {
    LIST: (companySlug: string) => `${BASE}/${companySlug}/audit-logs`,
  },

  // ── Menú: categorías (nivel compañía, gestión) ────────────
  MENU_CATEGORIES: {
    LIST: (companySlug: string) => `${BASE}/${companySlug}/menu-categories`,
    CREATE: (companySlug: string) => `${BASE}/${companySlug}/menu-categories`,
    UPDATE: (companySlug: string, id: string) => `${BASE}/${companySlug}/menu-categories/${id}`,
    REMOVE: (companySlug: string, id: string) => `${BASE}/${companySlug}/menu-categories/${id}`,
  },

  // ── Productos (nivel compañía, catálogo base) ─────────────
  PRODUCTS: {
    LIST: (companySlug: string) => `${BASE}/${companySlug}/products`,
    DETAIL: (companySlug: string, id: string) => `${BASE}/${companySlug}/products/${id}`,
    CREATE: (companySlug: string) => `${BASE}/${companySlug}/products`,
    UPDATE: (companySlug: string, id: string) => `${BASE}/${companySlug}/products/${id}`,
    REMOVE: (companySlug: string, id: string) => `${BASE}/${companySlug}/products/${id}`,
    SET_INGREDIENTS: (companySlug: string, id: string) => `${BASE}/${companySlug}/products/${id}/ingredients`,
    SET_ALLERGENS: (companySlug: string, id: string) => `${BASE}/${companySlug}/products/${id}/allergens`,
    SET_MODIFIER_GROUPS: (companySlug: string, id: string) => `${BASE}/${companySlug}/products/${id}/modifier-groups`,
    ADD_MEDIA: (companySlug: string, id: string) => `${BASE}/${companySlug}/products/${id}/media`, // foto o video, un solo input
    REMOVE_MEDIA: (companySlug: string, id: string, mediaId: string) =>
      `${BASE}/${companySlug}/products/${id}/media/${mediaId}`,
    SET_PRIMARY_MEDIA: (companySlug: string, id: string, mediaId: string) =>
      `${BASE}/${companySlug}/products/${id}/media/${mediaId}/primary`,
  },

  // ── Promociones (nivel compañía, gestión) ─────────────────
  PROMOTIONS: {
    LIST: (companySlug: string) => `${BASE}/${companySlug}/promotions`,
    CREATE: (companySlug: string) => `${BASE}/${companySlug}/promotions`,
    UPDATE: (companySlug: string, id: string) => `${BASE}/${companySlug}/promotions/${id}`,
    REMOVE: (companySlug: string, id: string) => `${BASE}/${companySlug}/promotions/${id}`,
    UPLOAD_IMAGE: (companySlug: string, id: string) => `${BASE}/${companySlug}/promotions/${id}/image`,
  },

  // ── Clientes ───────────────────────────────────────────────
  CUSTOMERS: {
    LIST: (companySlug: string) => `${BASE}/${companySlug}/customers`,
    DETAIL: (companySlug: string, id: string) => `${BASE}/${companySlug}/customers/${id}`,
    CREATE_OR_FIND: (companySlug: string) => `${BASE}/${companySlug}/customers`,
    UPDATE: (companySlug: string, id: string) => `${BASE}/${companySlug}/customers/${id}`,
  },

  // ── Catálogo de ingredientes ────────────────────────────────
  INGREDIENTS: {
    LIST: (companySlug: string) => `${BASE}/${companySlug}/ingredients`,
    CREATE: (companySlug: string) => `${BASE}/${companySlug}/ingredients`,
    REMOVE: (companySlug: string, id: string) => `${BASE}/${companySlug}/ingredients/${id}`,
  },

  // ── Grupos de modificadores + modificadores ────────────────
  MODIFIER_GROUPS: {
    LIST: (companySlug: string) => `${BASE}/${companySlug}/modifier-groups`,
    CREATE: (companySlug: string) => `${BASE}/${companySlug}/modifier-groups`,
    UPDATE: (companySlug: string, id: string) => `${BASE}/${companySlug}/modifier-groups/${id}`,
    REMOVE: (companySlug: string, id: string) => `${BASE}/${companySlug}/modifier-groups/${id}`,
    ADD_MODIFIER: (companySlug: string, id: string) => `${BASE}/${companySlug}/modifier-groups/${id}/modifiers`,
  },
  MODIFIERS: {
    UPDATE: (companySlug: string, id: string) => `${BASE}/${companySlug}/modifiers/${id}`,
    REMOVE: (companySlug: string, id: string) => `${BASE}/${companySlug}/modifiers/${id}`,
  },

  // =====================================================================
  // NIVEL SUCURSAL — todo lo de abajo necesita companySlug Y branchSlug.
  // =====================================================================

  BRANCH: {
    DETAIL: (companySlug: string, branchSlug: string) => `${BASE}/${companySlug}/${branchSlug}`,
    UPDATE: (companySlug: string, branchSlug: string) => `${BASE}/${companySlug}/${branchSlug}`,
    UPLOAD_COVER: (companySlug: string, branchSlug: string) => `${BASE}/${companySlug}/${branchSlug}/cover`,
    GET_SETTINGS: (companySlug: string, branchSlug: string) => `${BASE}/${companySlug}/${branchSlug}/settings`,
    UPDATE_SETTINGS: (companySlug: string, branchSlug: string) => `${BASE}/${companySlug}/${branchSlug}/settings`,
    SET_DEFAULT: (companySlug: string, branchSlug: string) => `${BASE}/${companySlug}/${branchSlug}/set-default`,
  },

  // ── Menú/productos/promos EFECTIVOS de esta sucursal (públicos, sin login) ──
  BRANCH_MENU_CATEGORIES: {
    LIST: (companySlug: string, branchSlug: string) => `${BASE}/${companySlug}/${branchSlug}/menu-categories`,
  },
  BRANCH_PRODUCTS: {
    LIST: (companySlug: string, branchSlug: string) => `${BASE}/${companySlug}/${branchSlug}/products`,
    DETAIL: (companySlug: string, branchSlug: string, id: string) =>
      `${BASE}/${companySlug}/${branchSlug}/products/${id}`,
    SET_OVERRIDE: (companySlug: string, branchSlug: string, id: string) =>
      `${BASE}/${companySlug}/${branchSlug}/products/${id}/override`, // PUT — precio/disponibilidad de ESTA sucursal
    CLEAR_OVERRIDE: (companySlug: string, branchSlug: string, id: string) =>
      `${BASE}/${companySlug}/${branchSlug}/products/${id}/override`, // DELETE
  },
  BRANCH_PROMOTIONS: {
    LIST: (companySlug: string, branchSlug: string) => `${BASE}/${companySlug}/${branchSlug}/promotions`,
    SET_OVERRIDE: (companySlug: string, branchSlug: string, id: string) =>
      `${BASE}/${companySlug}/${branchSlug}/promotions/${id}/override`, // PUT
    CLEAR_OVERRIDE: (companySlug: string, branchSlug: string, id: string) =>
      `${BASE}/${companySlug}/${branchSlug}/promotions/${id}/override`, // DELETE
  },

  // ── QR del cliente — ver CLIENT.RESOLVE_QR más abajo, fuera de este objeto ──

  // ── Áreas y mesas ───────────────────────────────────────────
  AREAS: {
    LIST: (companySlug: string, branchSlug: string) => `${BASE}/${companySlug}/${branchSlug}/areas`,
    CREATE: (companySlug: string, branchSlug: string) => `${BASE}/${companySlug}/${branchSlug}/areas`,
    UPDATE: (companySlug: string, branchSlug: string, id: string) =>
      `${BASE}/${companySlug}/${branchSlug}/areas/${id}`,
    REMOVE: (companySlug: string, branchSlug: string, id: string) =>
      `${BASE}/${companySlug}/${branchSlug}/areas/${id}`,
  },
  TABLES: {
    LIST: (companySlug: string, branchSlug: string) => `${BASE}/${companySlug}/${branchSlug}/tables`,
    CREATE: (companySlug: string, branchSlug: string) => `${BASE}/${companySlug}/${branchSlug}/tables`,
    UPDATE: (companySlug: string, branchSlug: string, id: string) =>
      `${BASE}/${companySlug}/${branchSlug}/tables/${id}`,
    REMOVE: (companySlug: string, branchSlug: string, id: string) =>
      `${BASE}/${companySlug}/${branchSlug}/tables/${id}`,
    OPEN_SESSION: (companySlug: string, branchSlug: string, tableId: string) =>
      `${BASE}/${companySlug}/${branchSlug}/tables/${tableId}/sessions`, // el mesero genera el token de la mesa
    CALL_WAITER: (companySlug: string, branchSlug: string, tableId: string) =>
      `${BASE}/${companySlug}/${branchSlug}/tables/${tableId}/waiter-calls`,
    REGENERATE_QR: (companySlug: string, branchSlug: string, tableId: string) =>
      `${BASE}/${companySlug}/${branchSlug}/tables/${tableId}/qr/regenerate`,
  },
  TABLE_SESSIONS: {
    CLOSE: (companySlug: string, branchSlug: string, id: string) =>
      `${BASE}/${companySlug}/${branchSlug}/table-sessions/${id}/close`,
  },
  WAITER_CALLS: {
    LIST: (companySlug: string, branchSlug: string) => `${BASE}/${companySlug}/${branchSlug}/waiter-calls`,
    ATTEND: (companySlug: string, branchSlug: string, id: string) =>
      `${BASE}/${companySlug}/${branchSlug}/waiter-calls/${id}/attend`,
  },

  // ── Pedidos ─────────────────────────────────────────────────
  ORDERS: {
    // Cliente (QR) — requiere header X-Session-Token, NO Authorization Bearer.
    CREATE_PUBLIC: (companySlug: string, branchSlug: string) => `${BASE}/${companySlug}/${branchSlug}/orders`,
    MY_ACTIVE_ORDER: (companySlug: string, branchSlug: string) =>
      `${BASE}/${companySlug}/${branchSlug}/orders/mine`,
    TRACK: (companySlug: string, branchSlug: string, id: string) =>
      `${BASE}/${companySlug}/${branchSlug}/orders/${id}/track`, // PÚBLICO — el UUID es el capability token

    // Staff — requiere JWT.
    LIST: (companySlug: string, branchSlug: string) => `${BASE}/${companySlug}/${branchSlug}/orders`,
    CREATE_STAFF: (companySlug: string, branchSlug: string) => `${BASE}/${companySlug}/${branchSlug}/orders/staff`,
    DETAIL: (companySlug: string, branchSlug: string, id: string) =>
      `${BASE}/${companySlug}/${branchSlug}/orders/${id}`,
    UPDATE_STATUS: (companySlug: string, branchSlug: string, id: string) =>
      `${BASE}/${companySlug}/${branchSlug}/orders/${id}/status`,
    CLAIM: (companySlug: string, branchSlug: string, id: string) =>
      `${BASE}/${companySlug}/${branchSlug}/orders/${id}/claim`, // cocinero se autoasigna
    ASSIGN: (companySlug: string, branchSlug: string, id: string) =>
      `${BASE}/${companySlug}/${branchSlug}/orders/${id}/assign`, // admin reasigna/agrega cocineros
    ADD_ITEM: (companySlug: string, branchSlug: string, orderId: string) =>
      `${BASE}/${companySlug}/${branchSlug}/orders/${orderId}/items`,
    ADD_COMBO: (companySlug: string, branchSlug: string, orderId: string) =>
      `${BASE}/${companySlug}/${branchSlug}/orders/${orderId}/combos`,
    REMOVE_ITEM: (companySlug: string, branchSlug: string, orderId: string, itemId: string) =>
      `${BASE}/${companySlug}/${branchSlug}/orders/${orderId}/items/${itemId}`,
    CHARGE: (companySlug: string, branchSlug: string, id: string) =>
      `${BASE}/${companySlug}/${branchSlug}/orders/${id}/charge`, // cobro atómico: pago + COMPLETED en una transacción
    INVOICE_JSON: (companySlug: string, branchSlug: string, id: string) =>
      `${BASE}/${companySlug}/${branchSlug}/orders/${id}/invoice`, // JSON, para mostrar antes de imprimir
  },

  ORDER_ITEMS: {
    UPDATE_KITCHEN_STATUS: (companySlug: string, branchSlug: string, id: string) =>
      `${BASE}/${companySlug}/${branchSlug}/order-items/${id}/kitchen-status`,
  },

  KITCHEN: {
    QUEUE: (companySlug: string, branchSlug: string) => `${BASE}/${companySlug}/${branchSlug}/kitchen`,
  },

  // ── Pagos y factura ─────────────────────────────────────────
  PAYMENTS: {
    CREATE: (companySlug: string, branchSlug: string, orderId: string) =>
      `${BASE}/${companySlug}/${branchSlug}/orders/${orderId}/payments`,
    LIST_BY_ORDER: (companySlug: string, branchSlug: string, orderId: string) =>
      `${BASE}/${companySlug}/${branchSlug}/orders/${orderId}/payments`,
    REFUND: (companySlug: string, branchSlug: string, id: string) =>
      `${BASE}/${companySlug}/${branchSlug}/payments/${id}/refund`,
    INVOICE_PDF: (companySlug: string, branchSlug: string, id: string) =>
      `${BASE}/${companySlug}/${branchSlug}/payments/${id}/invoice`, // devuelve el PDF directo
  },

  // ── Reseñas ─────────────────────────────────────────────────
  REVIEWS: {
    LIST: (companySlug: string, branchSlug: string) => `${BASE}/${companySlug}/${branchSlug}/reviews`,
    CREATE_FOR_ORDER: (companySlug: string, branchSlug: string, orderId: string) =>
      `${BASE}/${companySlug}/${branchSlug}/orders/${orderId}/reviews`,
  },

  // ── Reservas ────────────────────────────────────────────────
  RESERVATIONS: {
    LIST: (companySlug: string, branchSlug: string) => `${BASE}/${companySlug}/${branchSlug}/reservations`,
    CREATE: (companySlug: string, branchSlug: string) => `${BASE}/${companySlug}/${branchSlug}/reservations`,
    UPDATE: (companySlug: string, branchSlug: string, id: string) =>
      `${BASE}/${companySlug}/${branchSlug}/reservations/${id}`,
  },

  // ── Reportes (solo admin) ────────────────────────────────────
  REPORTS: {
    SALES_DAILY: (companySlug: string, branchSlug: string) =>
      `${BASE}/${companySlug}/${branchSlug}/reports/sales-daily`, // ?from=YYYY-MM-DD&to=YYYY-MM-DD
    PRODUCT_SALES: (companySlug: string, branchSlug: string) =>
      `${BASE}/${companySlug}/${branchSlug}/reports/product-sales`,
    WAITER_PERFORMANCE: (companySlug: string, branchSlug: string) =>
      `${BASE}/${companySlug}/${branchSlug}/reports/waiter-performance`,
    TABLE_STATUS: (companySlug: string, branchSlug: string) =>
      `${BASE}/${companySlug}/${branchSlug}/reports/table-status`,
    SUMMARY: (companySlug: string, branchSlug: string) =>
      `${BASE}/${companySlug}/${branchSlug}/reports/summary`, // ?period=today|week|month|year
    TIMESERIES: (companySlug: string, branchSlug: string) =>
      `${BASE}/${companySlug}/${branchSlug}/reports/timeseries`, // ?period=...&groupBy=day|month
    TOP_PRODUCTS: (companySlug: string, branchSlug: string) =>
      `${BASE}/${companySlug}/${branchSlug}/reports/top-products`, // ?period=...&limit=5
  },

  HEALTH: () => `${BASE}/health`,
};

// ── Punto de entrada del cliente (QR, sin login) ────────────
// Separado del objeto API porque conceptualmente es otra superficie
// (nadie autenticado como staff llama esto).
export const CLIENT = {
  RESOLVE_QR: (companySlug: string, branchSlug: string, token: string) =>
    `${BASE}/${companySlug}/${branchSlug}/qr/${token}`,
  CALL_WAITER: (companySlug: string, branchSlug: string) =>
    `${BASE}/${companySlug}/${branchSlug}/waiter-calls`, // POST, requireOpenSession — no confundir con TABLES.CALL_WAITER (esa es de staff)
};