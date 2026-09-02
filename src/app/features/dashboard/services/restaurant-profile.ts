import { Injectable, inject } from '@angular/core';
import { Api } from '../../../core/services/api';
import { API } from '../../../core/services/api.endpoints';
import { Restaurant } from '../../../core/models/menu';

/** Perfil del restaurante (nombre, logo, colores de marca) — lo usa el shell de admin. */
@Injectable({ providedIn: 'root' })
export class RestaurantProfile {
  private api = inject(Api);

  /** GET /api/restaurantes/:slug — público, trae también los colores de marca. */
  getBySlug(slug: string) {
    return this.api.get<Restaurant>(API.RESTAURANT.PROFILE(slug));
  }

  /** POST /api/restaurantes/:slug/logo — multipart, campo "file". Requiere sesión de admin. */
  uploadLogo(slug: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.post<Restaurant>(API.RESTAURANT.UPLOAD_LOGO(slug), formData);
  }
}
