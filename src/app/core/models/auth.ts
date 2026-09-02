// Reflejan la respuesta de POST /:slug/auth/login y POST /restaurantes/register
// del backend (mismo shape en los dos, ver auth.controller.js / restaurant.controller.js).

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
}

export interface AuthRestaurant {
  id: string;
  slug: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
  restaurant?: AuthRestaurant; // ausente en el login del SUPER_ADMIN (no pertenece a uno)
}

export interface RegisterPayload {
  restaurantName: string;
  slug: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}