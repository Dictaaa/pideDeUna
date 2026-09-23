import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { CompanyService } from '../../services/company.service';
import { RestaurantService } from '../../services/restaurant.service';
import { Company } from '../../models/company.model';
import { Restaurant } from '../../models/restaurant.model';
import { Navbar } from '../navbar/navbar';
import { Sidebar } from '../sidebar/sidebar';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, Navbar, Sidebar],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private companyService = inject(CompanyService);
  private restaurantService = inject(RestaurantService);

  companySlug = this.route.snapshot.paramMap.get('companySlug')!;

  company = signal<Company | null>(null);
  // null cuando estás en una página de COMPAÑÍA (ej. /admin/:companySlug/usuarios,
  // sin sucursal); con valor cuando entraste a una sucursal concreta.
  restaurant = signal<Restaurant | null>(null);
  sidebarOpen = signal(true);

  constructor() {
    // La marca (logo/colores) vive en la COMPAÑÍA, no en la sucursal —
    // todas las sucursales de un mismo dueño comparten la misma marca.
    this.companyService.getDetail(this.companySlug).subscribe({
      next: (c) => {
        this.company.set(c);
        document.documentElement.style.setProperty('--primary', c.primaryColor);
        document.documentElement.style.setProperty('--secondary', c.secondaryColor);
      },
      error: () => this.company.set(null),
    });

    this.trackCurrentBranch();
  }

  /** branchSlug vive en la ruta HIJA (dashboard/pedidos/etc.), no en la de Shell. */
  private trackCurrentBranch(): void {
    const readBranchSlug = (): string | null => {
      let current: ActivatedRoute | null = this.route;
      while (current?.firstChild) current = current.firstChild;
      return current?.snapshot?.paramMap.get('branchSlug') ?? null;
    };

    const update = (branchSlug: string | null) => {
      if (!branchSlug) {
        this.restaurant.set(null);
        return;
      }
      this.restaurantService.getDetail(this.companySlug, branchSlug).subscribe({
        next: (r) => this.restaurant.set(r),
        error: () => this.restaurant.set(null),
      });
    };

    // No se lee de una en el constructor — en la carga inicial de la
    // app, el árbol de rutas hijas todavía puede no estar resuelto en
    // ese instante (current.snapshot llega undefined y truena). Se
    // espera al primer NavigationEnd, que es cuando el árbol ya quedó
    // completo — incluida la navegación inicial misma.
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => update(readBranchSlug()));
  }

  toggleSidebar(): void {
    this.sidebarOpen.set(!this.sidebarOpen());
  }
}