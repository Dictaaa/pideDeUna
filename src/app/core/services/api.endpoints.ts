// src/app/core/services/api.endpoints.ts

import { environment } from '../../../environments/environment';

const BASE = environment.apiUrl;

export const API = {
  // ── Salud ───────────────────────────────────────────────
  HEALTH: `${BASE}/health`,

  // ── Auth ────────────────────────────────────────────────
  AUTH: {
    // Login único de la plataforma: solo correo y contraseña (el email
    // es único globalmente). Sirve tanto para staff como para SUPER_ADMIN.
    LOGIN: `${BASE}/auth/login`,
    // Registro público: crea el restaurante + su primer admin, y loguea de una.
    REGISTER: `${BASE}/restaurantes/register`,
  },

  // ── Restaurante ─────────────────────────────────────────
  RESTAURANT: {
    PROFILE: (slug: string) => `${BASE}/restaurantes/${slug}`,
    UPDATE_PROFILE: (slug: string) => `${BASE}/restaurantes/${slug}`,
    UPLOAD_LOGO: (slug: string) => `${BASE}/restaurantes/${slug}/logo`,
    MENU: (slug: string) => `${BASE}/restaurantes/${slug}/menu`,
  },

  // ── Categorías del menú ─────────────────────────────────
  CATEGORIES: {
    LIST: (slug: string) => `${BASE}/restaurantes/${slug}/categories`,
    CREATE: (slug: string) => `${BASE}/restaurantes/${slug}/categories`,
    BY_ID: (slug: string, id: string) => `${BASE}/restaurantes/${slug}/categories/${id}`,
  },

  // ── Productos ───────────────────────────────────────────
  PRODUCTS: {
    LIST: (slug: string) => `${BASE}/restaurantes/${slug}/products`,
    CREATE: (slug: string) => `${BASE}/restaurantes/${slug}/products`,
    BY_ID: (slug: string, id: string) => `${BASE}/restaurantes/${slug}/products/${id}`,
    SET_INGREDIENTS: (slug: string, id: string) => `${BASE}/restaurantes/${slug}/products/${id}/ingredients`,
    SET_ALLERGENS: (slug: string, id: string) => `${BASE}/restaurantes/${slug}/products/${id}/allergens`,
    SET_MODIFIER_GROUPS: (slug: string, id: string) => `${BASE}/restaurantes/${slug}/products/${id}/modifier-groups`,
    // multipart/form-data, campo "file" (imagen o video, ver storage.service.js del backend)
    MEDIA_UPLOAD: (slug: string, productId: string) => `${BASE}/restaurantes/${slug}/products/${productId}/media`,
    MEDIA_DELETE: (slug: string, productId: string, mediaId: string) =>
      `${BASE}/restaurantes/${slug}/products/${productId}/media/${mediaId}`,
  },

  // ── Ingredientes (por restaurante) ──────────────────────
  INGREDIENTS: {
    LIST: (slug: string) => `${BASE}/restaurantes/${slug}/ingredients`,
    CREATE: (slug: string) => `${BASE}/restaurantes/${slug}/ingredients`,
    DELETE: (slug: string, id: string) => `${BASE}/restaurantes/${slug}/ingredients/${id}`,
  },

  // ── Alérgenos (catálogo global, NO por restaurante) ─────
  ALLERGENS: {
    LIST: `${BASE}/alergenos`,
    CREATE: `${BASE}/alergenos`,
  },

  // ── Grupos de modificadores y sus opciones ──────────────
  MODIFIER_GROUPS: {
    LIST: (slug: string) => `${BASE}/restaurantes/${slug}/modifier-groups`,
    CREATE: (slug: string) => `${BASE}/restaurantes/${slug}/modifier-groups`,
    BY_ID: (slug: string, id: string) => `${BASE}/restaurantes/${slug}/modifier-groups/${id}`,
    ADD_OPTION: (slug: string, groupId: string) => `${BASE}/restaurantes/${slug}/modifier-groups/${groupId}/options`,
    OPTION: (slug: string, groupId: string, optionId: string) =>
      `${BASE}/restaurantes/${slug}/modifier-groups/${groupId}/options/${optionId}`,
  },

  // ── Usuarios (staff del restaurante) ────────────────────
  USERS: {
    LIST: (slug: string) => `${BASE}/restaurantes/${slug}/users`,
    CREATE: (slug: string) => `${BASE}/restaurantes/${slug}/users`,
    BY_ID: (slug: string, id: string) => `${BASE}/restaurantes/${slug}/users/${id}`,
    SET_ROLES: (slug: string, id: string) => `${BASE}/restaurantes/${slug}/users/${id}/roles`,
  },

  // ── Roles y permisos (catálogo global) ──────────────────
  ROLES: {
    LIST: `${BASE}/roles`,
    CREATE: `${BASE}/roles`,
    SET_PERMISSIONS: (id: string) => `${BASE}/roles/${id}/permissions`,
  },
  PERMISSIONS: {
    LIST: `${BASE}/permisos`,
    CREATE: `${BASE}/permisos`,
  },

  // ── Planes y suscripción ─────────────────────────────────
  PLANS: {
    LIST: `${BASE}/planes`,
    CREATE: `${BASE}/planes`,
  },
  SUBSCRIPTION: {
    GET: (slug: string) => `${BASE}/restaurantes/${slug}/subscription`,
    USAGE: (slug: string) => `${BASE}/restaurantes/${slug}/subscription/usage`,
    CHANGE: (slug: string) => `${BASE}/restaurantes/${slug}/subscription`,
  },

  // ── Áreas y mesas ────────────────────────────────────────
  AREAS: {
    LIST: (slug: string) => `${BASE}/restaurantes/${slug}/areas`,
    CREATE: (slug: string) => `${BASE}/restaurantes/${slug}/areas`,
    BY_ID: (slug: string, id: string) => `${BASE}/restaurantes/${slug}/areas/${id}`,
  },
  TABLES: {
    LIST: (slug: string) => `${BASE}/restaurantes/${slug}/tables`,
    CREATE: (slug: string) => `${BASE}/restaurantes/${slug}/tables`,
    BY_ID: (slug: string, id: string) => `${BASE}/restaurantes/${slug}/tables/${id}`,
    REGENERATE_QR: (slug: string, id: string) => `${BASE}/restaurantes/${slug}/tables/${id}/qr/regenerate`,
  },

  // ── Estadísticas (solo admin) ────────────────────────────
  STATS: {
    SUMMARY: (slug: string) => `${BASE}/restaurantes/${slug}/stats/summary`,
    TIMESERIES: (slug: string) => `${BASE}/restaurantes/${slug}/stats/timeseries`,
    TOP_PRODUCTS: (slug: string) => `${BASE}/restaurantes/${slug}/stats/top-products`,
  },

  // ── Super Admin (global, sin slug) ───────────────────────
  SUPER_ADMIN: {
    RESTAURANTS: () => `${BASE}/super-admin/restaurants`,
    RESTAURANT_BY_ID: (id: string) => `${BASE}/super-admin/restaurants/${id}`,
    RESTAURANT_STATUS: (id: string) => `${BASE}/super-admin/restaurants/${id}/status`,
    RESTAURANT_PLAN: (id: string) => `${BASE}/super-admin/restaurants/${id}/plan`,
    PLANS: () => `${BASE}/super-admin/plans`,
    PLAN_BY_ID: (id: string) => `${BASE}/super-admin/plans/${id}`,
  },

  // ── Pedidos ──────────────────────────────────────────────
  ORDERS: {
    LIST: (slug: string) => `${BASE}/restaurantes/${slug}/orders`,
    CREATE: (slug: string) => `${BASE}/restaurantes/${slug}/orders`,
    ADD_ITEM: (slug: string, id: string) => `${BASE}/restaurantes/${slug}/orders/${id}/items`,
    REMOVE_ITEM: (slug: string, id: string, itemId: string) =>
      `${BASE}/restaurantes/${slug}/orders/${id}/items/${itemId}`,
    CANCEL: (slug: string, id: string) => `${BASE}/restaurantes/${slug}/orders/${id}/cancel`,
    ADVANCE: (slug: string, id: string) => `${BASE}/restaurantes/${slug}/orders/${id}/advance`,
    SERVE: (slug: string, id: string) => `${BASE}/restaurantes/${slug}/orders/${id}/serve`,
  },

  // ── Clientes ─────────────────────────────────────────────
  CUSTOMERS: {
    LIST: (slug: string) => `${BASE}/restaurantes/${slug}/customers`,
    CREATE: (slug: string) => `${BASE}/restaurantes/${slug}/customers`,
    BY_ID: (slug: string, id: string) => `${BASE}/restaurantes/${slug}/customers/${id}`,
  },

  // ── Reservas ─────────────────────────────────────────────
  RESERVATIONS: {
    LIST: (slug: string) => `${BASE}/restaurantes/${slug}/reservations`,
    CREATE: (slug: string) => `${BASE}/restaurantes/${slug}/reservations`,
    BY_ID: (slug: string, id: string) => `${BASE}/restaurantes/${slug}/reservations/${id}`,
  },

  // ── Promociones ──────────────────────────────────────────
  PROMOTIONS: {
    LIST: (slug: string) => `${BASE}/restaurantes/${slug}/promotions`,
    CREATE: (slug: string) => `${BASE}/restaurantes/${slug}/promotions`,
    BY_ID: (slug: string, id: string) => `${BASE}/restaurantes/${slug}/promotions/${id}`,
    SET_PRODUCTS: (slug: string, id: string) => `${BASE}/restaurantes/${slug}/promotions/${id}/products`,
  },

  // ── Reviews ──────────────────────────────────────────────
  REVIEWS: {
    LIST: (slug: string) => `${BASE}/restaurantes/${slug}/reviews`,
    CREATE: (slug: string) => `${BASE}/restaurantes/${slug}/reviews`,
  },

  // ── Configuración del restaurante ────────────────────────
  SETTINGS: {
    GET: (slug: string) => `${BASE}/restaurantes/${slug}/settings`,
    UPDATE: (slug: string) => `${BASE}/restaurantes/${slug}/settings`,
  },

  // ── Auditoría (solo lectura) ─────────────────────────────
  AUDIT_LOGS: {
    LIST: (slug: string) => `${BASE}/restaurantes/${slug}/audit-logs`,
  },
} as const;