import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  restaurantName = input<string>('');
  restaurantLogoUrl = input<string | null>(null);
  userName = input<string>('');

  toggleSidebar = output<void>();
  logout = output<void>();
}