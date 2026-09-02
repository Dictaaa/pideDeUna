import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { Auth } from '../../services/auth';
import { RestaurantProfile } from '../../../features/dashboard/services/restaurant-profile';
import { Restaurant } from '../../models/menu';
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
  private auth = inject(Auth);
  private restaurantProfile = inject(RestaurantProfile);

  slug = this.route.snapshot.paramMap.get('slug')!;
  restaurant = signal<Restaurant | null>(null);
  sidebarOpen = signal(true);

  userName = this.auth.user()?.name ?? '';

  constructor() {
    this.restaurantProfile.getBySlug(this.slug).subscribe({
      next: (r) => {
        this.restaurant.set(r);
        // Igual que en la plantilla neutral: el panel también respeta
        // el color de marca que el restaurante haya elegido.
        document.documentElement.style.setProperty('--primary', r.primaryColor);
        document.documentElement.style.setProperty('--secondary', r.secondaryColor);
      },
      error: () => this.restaurant.set(null),
    });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  toggleSidebar(): void {
    this.sidebarOpen.set(!this.sidebarOpen());
  }
}