import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { Auth } from '../../../../core/services/auth';
import { landingPathFor } from '../../../../shared/utils/landing-path';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private auth = inject(Auth);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = signal('');
  password = signal('');

  loading = signal(false);
  errorMessage = signal<string | null>(null);

  submit(): void {
    if (!this.email() || !this.password()) {
      this.errorMessage.set('Completa email y contraseña.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.auth.login(this.email().trim(), this.password()).subscribe({
      next: (res) => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        if (returnUrl) {
          this.router.navigateByUrl(returnUrl);
        } else if (res.restaurant) {
          this.router.navigateByUrl(`/admin/${res.restaurant.slug}/${landingPathFor(res.user.roles)}`);
        } else if (res.user.roles.includes('SUPER_ADMIN')) {
          this.router.navigateByUrl('/super-admin/restaurantes');
        } else {
          this.errorMessage.set('No sabemos a dónde mandarte — contacta a soporte.');
          this.loading.set(false);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.error || 'No pudimos iniciar sesión. Revisa tus datos.');
      },
    });
  }
}