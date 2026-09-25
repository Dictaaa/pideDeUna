import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CompanyService } from '../../services/company.service';
import { RoleCode } from '../../models/common.model';

interface NavItem {
  label: string;
  icon: string;
  path: string;
  roles: RoleCode[];
}

const ADMIN_ROLES: RoleCode[] = ['RESTAURANT_ADMIN', 'SUPER_ADMIN'];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  readonly auth = inject(AuthService);
  private companyService = inject(CompanyService);

  // companySlug siempre está disponible (Shell vive en /admin/:companySlug).
  // branchSlug es null mientras estés en una página de COMPAÑÍA (ej.
  // /admin/:companySlug/usuarios) — ahí los ítems de sucursal no aparecen.
  // El selector de sucursal en sí ya no vive acá — se movió al Navbar.
  companySlug = input.required<string>();
  branchSlug = input<string | null>(null);
  isOpen = input<boolean>(true);
  itemSelected = output<void>();

  // Si no hay sucursal activa (página de compañía), "Ver menú" apunta a
  // la sucursal default — se busca solo cuando hace falta.
  private defaultBranchSlug = signal<string | null>(null);

  constructor() {
    effect(() => {
      const c = this.companySlug();
      if (this.branchSlug()) return; // ya hay sucursal activa, no hace falta buscar la default
      this.companyService.listRestaurants(c).subscribe((list) => {
        const def = list.find((r) => r.isDefault) ?? list[0];
        this.defaultBranchSlug.set(def?.slug ?? null);
      });
    });
  }

  /** null solo si de verdad no hay ninguna sucursal creada todavía. */
  menuUrl = computed<string | null>(() => {
    const b = this.branchSlug() ?? this.defaultBranchSlug();
    return b ? `/${this.companySlug()}/${b}` : null;
  });

  // Nivel COMPAÑÍA — no piden sucursal, siempre visibles si el rol calza.
  private companyItems = computed<NavItem[]>(() => {
    const c = this.companySlug();
    return [
      { label: 'Categorías', icon: '🗂️', path: `/admin/${c}/categorias`, roles: ADMIN_ROLES },
      { label: 'Productos', icon: '🍽️', path: `/admin/${c}/productos`, roles: ADMIN_ROLES },
      { label: 'Adicionales', icon: '➕', path: `/admin/${c}/adicionales`, roles: ADMIN_ROLES },
      { label: 'Promociones', icon: '🏷️', path: `/admin/${c}/promociones`, roles: ADMIN_ROLES },
      { label: 'Usuarios', icon: '👥', path: `/admin/${c}/usuarios`, roles: ADMIN_ROLES },
      { label: 'Auditoría', icon: '🛡️', path: `/admin/${c}/auditoria`, roles: ADMIN_ROLES },
      { label: 'Mis Sucursales', icon: '🏬', path: `/admin/${c}/sucursales`, roles: ADMIN_ROLES },
      { label: 'Plan', icon: '💳', path: `/admin/${c}/plan`, roles: ADMIN_ROLES },
      { label: 'Configuración', icon: '⚙️', path: `/admin/${c}/configuracion`, roles: ADMIN_ROLES },
    ];
  });

  // Nivel SUCURSAL — solo aparecen si ya hay una sucursal activa (branchSlug).
  private branchItems = computed<NavItem[]>(() => {
    const c = this.companySlug();
    const b = this.branchSlug();
    if (!b) return [];
    return [
      { label: 'Dashboard', icon: '📊', path: `/admin/${c}/${b}/dashboard`, roles: ADMIN_ROLES },
      { label: 'Pedidos', icon: '🧾', path: `/admin/${c}/${b}/pedidos`, roles: [...ADMIN_ROLES, 'WAITER'] },
      { label: 'Caja', icon: '💵', path: `/admin/${c}/${b}/caja`, roles: [...ADMIN_ROLES, 'CASHIER'] },
      { label: 'Cocina', icon: '🍳', path: `/admin/${c}/${b}/cocina`, roles: [...ADMIN_ROLES, 'KITCHEN'] },
      { label: 'Mesas', icon: '🪑', path: `/admin/${c}/${b}/mesas`, roles: ADMIN_ROLES },
      { label: 'Áreas', icon: '📍', path: `/admin/${c}/${b}/areas`, roles: ADMIN_ROLES },
      { label: 'Historial', icon: '📖', path: `/admin/${c}/${b}/historial`, roles: [...ADMIN_ROLES, 'WAITER', 'CASHIER'] },
    ];
  });

  items = computed<NavItem[]>(() => {
    const branch = this.branchItems().filter((item) => this.auth.hasRole(...item.roles));
    const company = this.companyItems().filter((item) => this.auth.hasRole(...item.roles));
    return [...branch, ...company];
  });
}