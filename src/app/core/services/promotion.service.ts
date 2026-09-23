// src/app/core/services/promotion.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API } from './api.endpoints';
import { EffectivePromotion, Promotion, RestaurantPromotionOverride } from '../models/promotion.model';

@Injectable({ providedIn: 'root' })
export class PromotionService {
  constructor(private http: HttpClient) {}

  // Nivel compañía (gestión)
  list(companySlug: string, activeOnly = false): Observable<Promotion[]> {
    const url = activeOnly ? `${API.PROMOTIONS.LIST(companySlug)}?activeOnly=true` : API.PROMOTIONS.LIST(companySlug);
    return this.http.get<Promotion[]>(url);
  }

  create(companySlug: string, data: Partial<Promotion> & { productIds?: string[] }): Observable<Promotion> {
    return this.http.post<Promotion>(API.PROMOTIONS.CREATE(companySlug), data);
  }

  update(companySlug: string, id: string, patch: Partial<Promotion> & { productIds?: string[] }): Observable<Promotion> {
    return this.http.patch<Promotion>(API.PROMOTIONS.UPDATE(companySlug, id), patch);
  }

  remove(companySlug: string, id: string): Observable<void> {
    return this.http.delete<void>(API.PROMOTIONS.REMOVE(companySlug, id));
  }

  uploadImage(companySlug: string, id: string, file: File): Observable<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ imageUrl: string }>(API.PROMOTIONS.UPLOAD_IMAGE(companySlug, id), formData);
  }

  // Nivel sucursal (vista efectiva — pública)
  listForBranch(companySlug: string, branchSlug: string, activeOnly = false): Observable<EffectivePromotion[]> {
    const base = API.BRANCH_PROMOTIONS.LIST(companySlug, branchSlug);
    const url = activeOnly ? `${base}?activeOnly=true` : base;
    return this.http.get<EffectivePromotion[]>(url);
  }

  setOverride(
    companySlug: string,
    branchSlug: string,
    id: string,
    override: { percentageOverride?: number | null; fixedAmountOverride?: number | null; isAvailableOverride?: boolean | null }
  ): Observable<RestaurantPromotionOverride> {
    return this.http.put<RestaurantPromotionOverride>(API.BRANCH_PROMOTIONS.SET_OVERRIDE(companySlug, branchSlug, id), override);
  }

  clearOverride(companySlug: string, branchSlug: string, id: string): Observable<void> {
    return this.http.delete<void>(API.BRANCH_PROMOTIONS.CLEAR_OVERRIDE(companySlug, branchSlug, id));
  }
}