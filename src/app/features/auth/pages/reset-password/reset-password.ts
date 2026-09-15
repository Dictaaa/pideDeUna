import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Auth } from '../../../../core/services/auth';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: '../login/login.scss',
})
export class ResetPassword {
  private auth = inject(Auth);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  token = this.route.snapshot.queryParamMap.get('token') ?? '';

  newPassword = signal('');
  confirmPassword = signal('');
  loading = signal(false);
  done = signal(false);
  errorMessage = signal<string | null>(null);

  submit(): void {
    if (!this.token) {
      this.errorMessage.set('Este enlace no es válido. Solicita uno nuevo.');
      return;
    }
    if (this.newPassword().length < 8) {
      this.errorMessage.set('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (this.newPassword() !== this.confirmPassword()) {
      this.errorMessage.set('Las dos contraseñas no coinciden.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.auth.resetPassword(this.token, this.newPassword()).subscribe({
      next: () => {
        this.loading.set(false);
        this.done.set(true);
        setTimeout(() => this.router.navigateByUrl('/login'), 2000);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.error || 'El enlace no es válido o ya expiró. Solicita uno nuevo.');
      },
    });
  }
}