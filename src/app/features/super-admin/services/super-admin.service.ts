import { Injectable, inject } from '@angular/core';
import { Api } from '../../../core/services/api';
import { API } from '../../../core/services/api.endpoints';
import { CreateRestaurantPayload, RestaurantDetail, RestaurantListItem } from '../models/super-admin.models';
import { PlanInfo } from '../../plan/models/plan.models';

@Injectable({ providedIn: 'root' })
export class SuperAdminService {
  private api = inject(Api);

  listRestaurants(search?: string) {
    return this.api.get<RestaurantListItem[]>(API.SUPER_ADMIN.RESTAURANTS(), search ? { search } : undefined);
  }

  getRestaurant(id: string) {
    return this.api.get<RestaurantDetail>(API.SUPER_ADMIN.RESTAURANT_BY_ID(id));
  }

  createRestaurant(payload: CreateRestaurantPayload) {
    return this.api.post<{ restaurant: { id: string; slug: string }; admin: { email: string } }>(
      API.SUPER_ADMIN.RESTAURANTS(),
      payload
    );
  }

  updateRestaurant(id: string, payload: { name?: string; slug?: string }) {
    return this.api.patch<RestaurantDetail['restaurant']>(API.SUPER_ADMIN.RESTAURANT_BY_ID(id), payload);
  }

  setStatus(id: string, status: string) {
    return this.api.post<RestaurantDetail['restaurant']>(API.SUPER_ADMIN.RESTAURANT_STATUS(id), { status });
  }

  changePlan(id: string, planId: string) {
    return this.api.post<unknown>(API.SUPER_ADMIN.RESTAURANT_PLAN(id), { planId });
  }

  listPlans() {
    return this.api.get<PlanInfo[]>(API.SUPER_ADMIN.PLANS());
  }

  createPlan(payload: Partial<PlanInfo>) {
    return this.api.post<PlanInfo>(API.SUPER_ADMIN.PLANS(), payload);
  }

  updatePlan(id: string, payload: Partial<PlanInfo> & { isActive?: boolean }) {
    return this.api.patch<PlanInfo>(API.SUPER_ADMIN.PLAN_BY_ID(id), payload);
  }
}