// src/app/core/models/auth.model.ts
import { RoleCode, UUID, UserStatus } from './common.model';

export interface AuthUser {
  id: UUID;
  name: string;
  email: string;
  status?: UserStatus;
}

// El login trae los roles DENTRO de user; /auth/me los trae APARTE
// (roles: [...] al nivel de MeResponse) — son formas distintas porque
// son respuestas de dos endpoints distintos, no un descuido: no las
// unifiques en un solo tipo o vas a terminar con un campo que a veces
// no existe.
export interface LoginUser extends AuthUser {
  roles: RoleCode[];
}

export interface CompanySummary {
  id: UUID;
  slug: string;
  name: string;
  status: string;
}

export interface RestaurantSummary {
  id: UUID;
  slug: string;
  name: string;
  status: string;
}

// Respuesta de POST /auth/login cuando el usuario tiene UNA sola
// sucursal efectiva (o es dueño con acceso a toda la compañía) —
// el caso normal, token ya utilizable.
export interface LoginResponse {
  token: string;
  user: LoginUser;
  company?: CompanySummary & { restaurants?: RestaurantSummary[] };
  restaurant?: RestaurantSummary | null; // presente cuando el usuario tiene una sola sucursal fija
}

// Membresía de un usuario con roles en MÁS DE UNA sucursal — solo
// aparece cuando login() no pudo resolver un único contexto.
export interface RestaurantMembership {
  roleCode: RoleCode;
  restaurantId: UUID | null;
  restaurantName: string | null;
}

// Respuesta de POST /auth/login cuando hace falta elegir sucursal.
export interface RequiresRestaurantSelectionResponse {
  requiresRestaurantSelection: true;
  preToken: string; // válido 5 min, solo sirve para POST /auth/select-restaurant
  memberships: RestaurantMembership[];
  company: CompanySummary;
}

// Respuesta de GET /auth/me
export interface MeResponse {
  user: AuthUser;
  roles: RoleCode[];
  company: CompanySummary | null;
  restaurant: RestaurantSummary | null;
}