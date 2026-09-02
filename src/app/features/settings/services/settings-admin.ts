import { Injectable, inject } from '@angular/core';
import { Api } from '../../../core/services/api';
import { API } from '../../../core/services/api.endpoints';
import { Restaurant } from '../../../core/models/menu';
import { RestaurantSettings } from '../models/settings.models';

@Injectable({ providedIn: 'root' })
export class SettingsAdmin {
  private api = inject(Api);

  getSettings(slug: string) {
    return this.api.get<RestaurantSettings>(API.SETTINGS.GET(slug));
  }
  updateSettings(slug: string, value: Partial<Omit<RestaurantSettings, 'restaurantId'>>) {
    return this.api.patch<RestaurantSettings>(API.SETTINGS.UPDATE(slug), value);
  }

  getProfile(slug: string) {
    return this.api.get<Restaurant>(API.RESTAURANT.PROFILE(slug));
  }
  updateBranding(slug: string, value: { primaryColor: string; secondaryColor: string; fontFamily: string }) {
    return this.api.patch<Restaurant>(API.RESTAURANT.UPDATE_PROFILE(slug), value);
  }
}
