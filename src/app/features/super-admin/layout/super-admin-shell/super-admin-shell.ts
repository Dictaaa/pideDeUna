import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Auth } from '../../../../core/services/auth';

@Component({
  selector: 'app-super-admin-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './super-admin-shell.html',
  styleUrl: './super-admin-shell.scss',
})
export class SuperAdminShell {
  private auth = inject(Auth);
  private router = inject(Router);

  userName = this.auth.user()?.name ?? '';

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}