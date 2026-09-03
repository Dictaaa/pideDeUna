import { Injectable, inject } from '@angular/core';
import { Api } from '../../../core/services/api';
import { API } from '../../../core/services/api.endpoints';
import { PlanInfo, SubscriptionUsage } from '../models/plan.models';

@Injectable({ providedIn: 'root' })
export class PlanAdmin {
  private api = inject(Api);

  /** Catálogo global de planes (BASIC, PRO, PREMIUM). */
  listPlans() {
    return this.api.get<PlanInfo[]>(API.PLANS.LIST);
  }
  getUsage(slug: string) {
    return this.api.get<SubscriptionUsage>(API.SUBSCRIPTION.USAGE(slug));
  }
  changePlan(slug: string, planId: string) {
    return this.api.post<unknown>(API.SUBSCRIPTION.CHANGE(slug), { planId });
  }
}