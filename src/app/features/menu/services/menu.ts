import { Injectable, inject } from '@angular/core';
import { Api } from '../../../core/services/api';
import { API } from '../../../core/services/api.endpoints';
import { RestaurantMenuResponse } from '../../../core/models/menu';

/** Todo lo relacionado a leer/administrar el menú de un restaurante. */
@Injectable({ providedIn: 'root' })
export class Menu {
  private api = inject(Api);

  /** GET /api/restaurantes/:slug/menu — vista pública, la que consume el cliente en la mesa. */
  getBySlug(slug: string) {
    return this.api.get<RestaurantMenuResponse>(API.RESTAURANT.MENU(slug));
  }
}
