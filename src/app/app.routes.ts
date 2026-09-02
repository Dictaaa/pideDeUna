import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { roleGuard } from './core/guards/role-guard';

const ADMIN_ROLES = ['RESTAURANT_ADMIN', 'SUPER_ADMIN'];

/**
 * Mismo esquema de URL por slug que en Desvare (desvare.com/:slug):
 * cada restaurante vive en pidedeuna.com/:slug para el menú público
 * (con o sin /mesa/:token, el link que trae el QR físico) — y en
 * pidedeuna.com/admin/:slug/* para el panel de administrador,
 * protegido por sesión.
 */
export const routes: Routes = [
  { path: '', redirectTo: 'restaurante-sua', pathMatch: 'full' }, // demo de arranque

  // ── Auth (públicas) ─────────────────────────────────────
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/pages/register/register').then((m) => m.Register),
  },

  // ── Panel de administrador (protegido) ──────────────────
  {
    path: 'admin/:slug',
    canActivate: [authGuard],
    loadComponent: () => import('./core/layout/shell/shell').then((m) => m.Shell),
    children: [
      // Dashboard es el fallback genérico — accesible a cualquier staff
      // logueado (no solo admin), así el '' -> 'dashboard' de acá abajo
      // nunca cae en un loop de redirects para mesera/cocina. El login
      // igual manda a cada rol directo a SU pantalla (ver login.ts).
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        canActivate: [roleGuard(...ADMIN_ROLES)],
        loadComponent: () => import('./features/dashboard/pages/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'pedidos',
        canActivate: [roleGuard(...ADMIN_ROLES, 'WAITER')],
        loadComponent: () => import('./features/orders/pages/orders/orders').then((m) => m.Orders),
      },
      {
        path: 'cocina',
        canActivate: [roleGuard(...ADMIN_ROLES, 'KITCHEN')],
        loadComponent: () =>
          import('./features/kitchen/pages/kitchen-board/kitchen-board').then((m) => m.KitchenBoard),
      },
      {
        path: 'categorias',
        canActivate: [roleGuard(...ADMIN_ROLES)],
        loadComponent: () => import('./features/categories/pages/categories/categories').then((m) => m.Categories),
      },
      {
        path: 'productos',
        canActivate: [roleGuard(...ADMIN_ROLES)],
        loadComponent: () => import('./features/products/pages/products/products').then((m) => m.Products),
      },
      {
        path: 'areas',
        canActivate: [roleGuard(...ADMIN_ROLES)],
        loadComponent: () => import('./features/areas/pages/areas/areas').then((m) => m.Areas),
      },
      {
        path: 'mesas',
        canActivate: [roleGuard(...ADMIN_ROLES)],
        loadComponent: () => import('./features/tables/pages/tables/tables').then((m) => m.Tables),
      },
      {
        path: 'usuarios',
        canActivate: [roleGuard(...ADMIN_ROLES)],
        loadComponent: () => import('./features/users/pages/users/users').then((m) => m.Users),
      },
      {
        path: 'configuracion',
        canActivate: [roleGuard(...ADMIN_ROLES)],
        loadComponent: () => import('./features/settings/pages/settings/settings').then((m) => m.Settings),
      },
    ],
  },

  // ── Menú público (lo que ve el cliente en la mesa) ──────
  {
    path: ':slug/mesa/:token',
    loadComponent: () => import('./features/menu/pages/menu-page/menu-page').then((m) => m.MenuPage),
  },
  {
    path: ':slug',
    loadComponent: () => import('./features/menu/pages/menu-page/menu-page').then((m) => m.MenuPage),
  },
];