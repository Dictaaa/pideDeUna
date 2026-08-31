import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: ':slug',
    loadComponent: () =>
      import('./features/menu/pages/menu-page/menu-page')
        .then(m => m.MenuPage),
  },

  {
    path: '',
    redirectTo: 'restaurante-sua',
    pathMatch: 'full',
  },

  {
    path: '**',
    redirectTo: 'restaurante-sua',
  },
];