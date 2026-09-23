import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { homeGuard } from './core/guards/home.guard';
import { superAdminGuard } from './core/guards/super-admin.guard';
import { RoleCode } from './core/models/common.model';

/**
 * Esquema de URL con DOS niveles de slug (compañía → sucursal), no uno
 * — reflejo directo de cómo quedó el backend tras la reingeniería:
 *
 *   pidedeuna.com/:companySlug                          → elegir sucursal (público)
 *   pidedeuna.com/:companySlug/:branchSlug              → menú de esa sucursal (público)
 *   pidedeuna.com/:companySlug/:branchSlug/mesa/:token  → QR físico de una mesa (público)
 *   pidedeuna.com/:companySlug/:branchSlug/pedido/:id   → seguimiento en vivo del pedido (público)
 *   pidedeuna.com/admin/:companySlug/*                  → cosas de COMPAÑÍA (catálogo, usuarios, plan…)
 *   pidedeuna.com/admin/:companySlug/:branchSlug/*      → cosas de SUCURSAL (pedidos, cocina, mesas…)
 *   pidedeuna.com/super-admin/*                         → plataforma completa (SUPER_ADMIN, sin slug)
 *
 * OJO — "admin", "login", "super-admin", "olvide-mi-clave",
 * "reset-password" y "forbidden" quedan como slugs de compañía
 * PROHIBIDOS (colisionan con estas rutas). Valídalo también en el
 * backend al crear una compañía, no solo acá.
 */

const ADMIN_ROLES: readonly RoleCode[] = ['RESTAURANT_ADMIN', 'SUPER_ADMIN'];

export const routes: Routes = [
  {
    path: '',
    canActivate: [homeGuard],
    loadComponent: () => import('./features/home/pages/home/home').then((m) => m.Home),
  },

  // ── Auth (públicas) ─────────────────────────────────────
  // Quité /register: no hay registro público — el SUPER_ADMIN crea
  // las compañías desde /super-admin/companias (por seguridad).
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/pages/login/login').then((m) => m.Login),
  },

  // ── Panel de administrador — NIVEL COMPAÑÍA ─────────────
  {
    path: 'admin/:companySlug',
    canActivate: [authGuard],
    loadComponent: () => import('./core/layout/shell/shell').then((m) => m.Shell),
    children: [
      // Sin sucursal fija, lo primero que tiene sentido ver es la
      // lista de sucursales (antes redirigía a "dashboard", que ya
      // no existe a este nivel — el dashboard es de SUCURSAL).
      { path: '', redirectTo: 'sucursales', pathMatch: 'full' },

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
        path: 'adicionales',
        canActivate: [roleGuard(...ADMIN_ROLES)],
        loadComponent: () =>
          import('./features/modifier-groups/pages/modifier-groups/modifier-groups').then((m) => m.ModifierGroups),
      },
      {
        path: 'promociones',
        canActivate: [roleGuard(...ADMIN_ROLES)],
        loadComponent: () => import('./features/promotions/pages/promotions/promotions').then((m) => m.Promotions),
      },
      {
        path: 'usuarios',
        canActivate: [roleGuard(...ADMIN_ROLES)],
        loadComponent: () => import('./features/users/pages/users/users').then((m) => m.Users),
      },
      {
        path: 'auditoria',
        canActivate: [roleGuard(...ADMIN_ROLES)],
        loadComponent: () => import('./features/audit-log/pages/audit-log/audit-log').then((m) => m.AuditLogPage),
      },
      {
        path: 'sucursales',
        canActivate: [roleGuard(...ADMIN_ROLES)],
        loadComponent: () => import('./features/branches/pages/branches/branches').then((m) => m.Branches),
      },
      {
        path: 'plan',
        canActivate: [roleGuard(...ADMIN_ROLES)],
        loadComponent: () => import('./features/plan/pages/plan/plan').then((m) => m.Plan),
      },
      {
        path: 'configuracion',
        canActivate: [roleGuard(...ADMIN_ROLES)],
        loadComponent: () => import('./features/settings/pages/settings/settings').then((m) => m.Settings),
      },

      // ── Panel de administrador — NIVEL SUCURSAL, anidado ──
      {
        path: ':branchSlug',
        children: [
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
            path: 'caja',
            canActivate: [roleGuard(...ADMIN_ROLES, 'CASHIER')],
            loadComponent: () => import('./features/caja/pages/caja/caja').then((m) => m.Caja),
          },
          {
            path: 'historial',
            canActivate: [roleGuard(...ADMIN_ROLES, 'WAITER', 'KITCHEN', 'CASHIER')],
            loadComponent: () =>
              import('./features/orders/pages/order-history/order-history').then((m) => m.OrderHistory),
          },
          {
            path: 'cocina',
            canActivate: [roleGuard(...ADMIN_ROLES, 'KITCHEN')],
            loadComponent: () =>
              import('./features/kitchen/pages/kitchen-board/kitchen-board').then((m) => m.KitchenBoard),
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
        ],
      },
    ],
  },

  // ── Super Admin (protegido, sin compañía/sucursal) ──────
  {
    path: 'super-admin',
    canActivate: [superAdminGuard],
    loadComponent: () =>
      import('./features/super-admin/layout/super-admin-shell/super-admin-shell').then((m) => m.SuperAdminShell),
    children: [
      { path: '', redirectTo: 'companias', pathMatch: 'full' },
      {
        path: 'companias',
        loadComponent: () => import('./features/super-admin/pages/companies/companies').then((m) => m.Companies),
      },
      {
        path: 'companias/:id',
        loadComponent: () =>
          import('./features/super-admin/pages/company-detail/company-detail').then((m) => m.CompanyDetailPage),
      },
      {
        path: 'planes',
        loadComponent: () => import('./features/super-admin/pages/plans/plans').then((m) => m.Plans),
      },
    ],
  },

  // ── Menú público (lo que ve el cliente) ─────────────────
  // Van del más específico al menos específico — Angular matchea en
  // orden, igual que Express: si ":companySlug/:branchSlug" quedara
  // antes que "mesa/:token" o "pedido/:orderId", nunca los alcanzaría.
  {
    path: ':companySlug/:branchSlug/mesa/:token',
    loadComponent: () => import('./features/menu/pages/menu-page/menu-page').then((m) => m.MenuPage),
  },
  {
    path: ':companySlug/:branchSlug/pedido/:orderId',
    loadComponent: () =>
      import('./features/menu/pages/order-tracking/order-tracking').then((m) => m.OrderTracking),
  },
  {
    path: ':companySlug/:branchSlug',
    loadComponent: () => import('./features/menu/pages/menu-page/menu-page').then((m) => m.MenuPage),
  },
  {
    // Sin sucursal: selector (o auto-redirect si la compañía tiene una
    // sola activa) — necesita CompanyService.getPublicInfo(), que es
    // el endpoint público nuevo (GET /:companySlug/public).
    path: ':companySlug',
    loadComponent: () =>
      import('./features/menu/pages/branch-picker/branch-picker').then((m) => m.BranchPicker),
  },

  // ── 404 — SIEMPRE al final ───────────────────────────────
  {
    path: '**',
    loadComponent: () => import('./features/not-found/pages/not-found/not-found').then((m) => m.NotFound),
  },
];