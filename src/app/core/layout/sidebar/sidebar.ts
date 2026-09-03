import { Component, computed, inject, input, output  } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Auth } from '../../services/auth';

interface NavItem {
  label: string;
  icon: string;
  path: string; // relativo a /admin/:slug
  roles: string[]; // quién ve este item — RESTAURANT_ADMIN/SUPER_ADMIN ven todo
}

const ADMIN_ROLES = ['RESTAURANT_ADMIN', 'SUPER_ADMIN'];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  private auth = inject(Auth);
  slug = input.required<string>();
  isOpen = input<boolean>(true);
  itemSelected = output<void>();

  private allItems = computed<NavItem[]>(() => [
    { label: 'Dashboard', icon: '📊', path: `/admin/${this.slug()}/dashboard`, roles: ADMIN_ROLES },
    { label: 'Pedidos', icon: '🧾', path: `/admin/${this.slug()}/pedidos`, roles: [...ADMIN_ROLES, 'WAITER'] },
    { label: 'Cocina', icon: '🍳', path: `/admin/${this.slug()}/cocina`, roles: [...ADMIN_ROLES, 'KITCHEN'] },
    { label: 'Categorías', icon: '🗂️', path: `/admin/${this.slug()}/categorias`, roles: ADMIN_ROLES },
    { label: 'Productos', icon: '🍽️', path: `/admin/${this.slug()}/productos`, roles: ADMIN_ROLES },
    { label: 'Áreas', icon: '📍', path: `/admin/${this.slug()}/areas`, roles: ADMIN_ROLES },
    { label: 'Mesas', icon: '🪑', path: `/admin/${this.slug()}/mesas`, roles: ADMIN_ROLES },
    { label: 'Usuarios', icon: '👥', path: `/admin/${this.slug()}/usuarios`, roles: ADMIN_ROLES },
    { label: 'Plan', icon: '💳', path: `/admin/${this.slug()}/plan`, roles: ADMIN_ROLES },
    { label: 'Configuración', icon: '⚙️', path: `/admin/${this.slug()}/configuracion`, roles: ADMIN_ROLES },
  ]);

  items = computed<NavItem[]>(() => this.allItems().filter((item) => this.auth.hasRole(...item.roles)));
}