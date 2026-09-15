import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Auth } from '../../../../core/services/auth';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: '../login/login.scss',
})
export class ForgotPassword {
  private auth = inject(Auth);

  email = signal('');
  loading = signal(false);
  sent = signal(false);
  errorMessage = signal<string | null>(null);

  submit(): void {
    if (!this.email().trim()) {
      this.errorMessage.set('Escribe tu correo.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.auth.forgotPassword(this.email().trim()).subscribe({
      next: () => {
        this.loading.set(false);
        this.sent.set(true); // el backend responde igual exista o no el correo — no hay nada más que mostrar
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.error || 'Algo salió mal. Intenta de nuevo.');
      },
    });
  }
}