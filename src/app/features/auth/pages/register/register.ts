import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../../../core/services/auth';
import { RestaurantProfile } from '../../../dashboard/services/restaurant-profile';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita tildes
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private auth = inject(Auth);
  private router = inject(Router);
  private restaurantProfile = inject(RestaurantProfile);

  restaurantName = signal('');
  slug = signal('');
  slugTouched = signal(false); // si el usuario edita el slug a mano, dejamos de autogenerarlo
  adminName = signal('');
  adminEmail = signal('');
  adminPassword = signal('');

  logoFile = signal<File | null>(null);
  logoPreviewUrl = signal<string | null>(null);

  loading = signal(false);
  errorMessage = signal<string | null>(null);

  slugPreview = computed(() => this.slug() || 'tu-restaurante');

  onRestaurantNameChange(value: string): void {
    this.restaurantName.set(value);
    if (!this.slugTouched()) {
      this.slug.set(slugify(value));
    }
  }

  onSlugChange(value: string): void {
    this.slugTouched.set(true);
    this.slug.set(slugify(value));
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.logoFile.set(file);

    if (this.logoPreviewUrl()) URL.revokeObjectURL(this.logoPreviewUrl()!);
    this.logoPreviewUrl.set(file ? URL.createObjectURL(file) : null);
  }

  submit(): void {
    if (!this.restaurantName() || !this.slug() || !this.adminName() || !this.adminEmail() || !this.adminPassword()) {
      this.errorMessage.set('Completa todos los campos.');
      return;
    }
    if (this.adminPassword().length < 8) {
      this.errorMessage.set('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const finalSlug = this.slug().trim();

    this.auth
      .register({
        restaurantName: this.restaurantName().trim(),
        slug: finalSlug,
        adminName: this.adminName().trim(),
        adminEmail: this.adminEmail().trim(),
        adminPassword: this.adminPassword(),
      })
      .subscribe({
        next: () => {
          const logo = this.logoFile();
          // El logo se sube DESPUÉS de crear la cuenta: el endpoint de logo
          // exige sesión, y hasta este punto el restaurante ni siquiera
          // existía. auth.register() ya dejó el token guardado, así que el
          // interceptor lo manda solo en esta segunda llamada.
          if (!logo) {
            this.router.navigateByUrl(`/admin/${finalSlug}/dashboard`);
            return;
          }
          this.restaurantProfile.uploadLogo(finalSlug, logo).subscribe({
            next: () => this.router.navigateByUrl(`/admin/${finalSlug}/dashboard`),
            error: () => {
              // No bloqueamos el registro por esto — el logo se puede
              // subir después desde Configuración.
              this.router.navigateByUrl(`/admin/${finalSlug}/dashboard`);
            },
          });
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(err?.error?.error || 'No pudimos crear tu restaurante. Intenta de nuevo.');
        },
      });
  }
}
