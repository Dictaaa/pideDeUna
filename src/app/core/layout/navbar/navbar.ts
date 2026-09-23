import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CompanyService } from '../../services/company.service';
import { RoleCode } from '../../models/common.model';

const ROLE_LABELS: Record<RoleCode, string> = {
  SUPER_ADMIN: 'Super administrador',
  RESTAURANT_ADMIN: 'Administrador',
  WAITER: 'Mesero',
  KITCHEN: 'Cocina',
  CASHIER: 'Cajero',
};

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  private auth = inject(AuthService);
  private companyService = inject(CompanyService);
  private router = inject(Router);

  // companySlug siempre está disponible (Shell vive en /admin/:companySlug).
  // branchSlug es null en una página de COMPAÑÍA — ahí no hay selector.
  companySlug = input.required<string>();
  branchSlug = input<string | null>(null);
  restaurantName = input<string>('');
  restaurantLogoUrl = input<string | null>(null);

  toggleSidebar = output<void>();

  userMenuOpen = signal(false);

  userName = computed(() => this.auth.me()?.user.name ?? '');
  userEmail = computed(() => this.auth.me()?.user.email ?? '');
  userRoleLabel = computed(() => (this.auth.me()?.roles ?? []).map((r) => ROLE_LABELS[r] ?? r).join(', '));

  /**
   * Solo tiene sentido para quien tiene acceso a TODA la compañía
   * (restaurantId null en el token) — un mesero o cocinero fijo de una
   * sucursal no tiene a dónde "cambiarse".
   */
  showBranchSwitcher = computed(() => this.auth.isCompanyWideAccess);
  branches = signal<{ id: string; slug: string; name: string }[]>([]);

  constructor() {
    // me() solo se llena si algo llamó loadMe() — eso hoy solo pasa en
    // homeGuard (ruta '/'). Si entraste directo a /admin/... sin pasar
    // por ahí, me() se queda en null para siempre y este navbar no
    // tiene de dónde sacar nombre/email/rol. Se autosana acá.
    if (!this.auth.me() && this.auth.isLoggedIn) {
      this.auth.loadMe().subscribe();
    }

    effect(() => {
      const slug = this.companySlug();
      if (!this.showBranchSwitcher()) return;
      this.companyService.listRestaurants(slug).subscribe((list) => {
        this.branches.set(list.map((r) => ({ id: r.id, slug: r.slug, name: r.name })));
      });
    });
  }

  /** Cambiar de sucursal — se queda dentro del panel, solo cambia el branchSlug de la URL. */
  onBranchChange(newSlug: string): void {
    if (newSlug === this.branchSlug()) return;
    this.router.navigateByUrl(`/admin/${this.companySlug()}/${newSlug}/dashboard`);
  }

  toggleUserMenu(): void {
    this.userMenuOpen.update((v) => !v);
  }

  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  logout(): void {
    this.auth.logout();
    this.closeUserMenu();
    this.router.navigate(['/login']);
  }
}