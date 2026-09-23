import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService, LoginResult } from '../../../../core/services/auth.service';
import { RestaurantMembership } from '../../../../core/models/auth.model';
import { landingPathFor } from '../../../../shared/utils/landing-path';

function requiresSelection(res: LoginResult): res is Extract<LoginResult, { requiresRestaurantSelection: true }> {
  return 'requiresRestaurantSelection' in res && res.requiresRestaurantSelection === true;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = signal('');
  password = signal('');

  loading = signal(false);
  errorMessage = signal<string | null>(null);

  // Solo se llenan si el login devolvió requiresRestaurantSelection —
  // caso raro: el usuario tiene roles en más de una sucursal a la vez.
  memberships = signal<RestaurantMembership[] | null>(null);
  companySlugForSelection = signal<string | null>(null);

  submit(): void {
    if (!this.email() || !this.password()) {
      this.errorMessage.set('Completa email y contraseña.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.auth.login(this.email().trim(), this.password()).subscribe({
      next: (res) => this.handleLoginResult(res),
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.error || 'No pudimos iniciar sesión. Revisa tus datos.');
      },
    });
  }

  private handleLoginResult(res: LoginResult): void {
    if (requiresSelection(res)) {
      // Le tocó a alguien con roles en varias sucursales — que elija.
      this.memberships.set(res.memberships);
      this.companySlugForSelection.set(res.company.slug);
      this.loading.set(false);
      return;
    }

    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (returnUrl) {
      this.router.navigateByUrl(returnUrl);
      return;
    }

    if (res.restaurant && res.company) {
      this.router.navigateByUrl(`/admin/${res.company.slug}/${res.restaurant.slug}/${landingPathFor(res.user.roles)}`);
      return;
    }

    if (res.company?.restaurants?.length) {
      // Dueño de compañía: entra a la primera sucursal — desde ahí
      // puede cambiar a cualquier otra con el selector del sidebar.
      this.router.navigateByUrl(
        `/admin/${res.company.slug}/${res.company.restaurants[0].slug}/${landingPathFor(res.user.roles)}`
      );
      return;
    }

    if (res.company) {
      // Dueño sin sucursales todavía — que las cree desde el panel de compañía.
      this.router.navigateByUrl(`/admin/${res.company.slug}`);
      return;
    }

    this.router.navigateByUrl('/super-admin/companias');
  }

  /** El usuario elige a cuál de sus sucursales entrar (caso multi-membresía). */
  selectRestaurant(restaurantId: string | null): void {
    this.loading.set(true);
    this.auth.selectRestaurant(restaurantId).subscribe({
      next: (res) => this.handleLoginResult(res),
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.error || 'No se pudo entrar a esa sucursal.');
      },
    });
  }
}