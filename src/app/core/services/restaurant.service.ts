// src/app/core/services/restaurant.service.ts
// Nota de nombres: "Restaurant" es SUCURSAL en todo el dominio — este
// servicio opera sobre UNA sucursal concreta (companySlug + branchSlug).
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API } from './api.endpoints';
import { BranchSettings, Restaurant } from '../models/restaurant.model';

@Injectable({ providedIn: 'root' })
export class RestaurantService {
  constructor(private http: HttpClient) {}

  getDetail(companySlug: string, branchSlug: string): Observable<Restaurant> {
    return this.http.get<Restaurant>(API.BRANCH.DETAIL(companySlug, branchSlug));
  }

  update(companySlug: string, branchSlug: string, patch: Partial<Restaurant>): Observable<Restaurant> {
    return this.http.patch<Restaurant>(API.BRANCH.UPDATE(companySlug, branchSlug), patch);
  }

  uploadCover(companySlug: string, branchSlug: string, file: File): Observable<{ coverUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ coverUrl: string }>(API.BRANCH.UPLOAD_COVER(companySlug, branchSlug), formData);
  }

  updateSettings(companySlug: string, branchSlug: string, patch: Partial<BranchSettings>): Observable<BranchSettings> {
    return this.http.patch<BranchSettings>(API.BRANCH.UPDATE_SETTINGS(companySlug, branchSlug), patch);
  }

  getSettings(companySlug: string, branchSlug: string): Observable<BranchSettings> {
    return this.http.get<BranchSettings>(API.BRANCH.GET_SETTINGS(companySlug, branchSlug));
  }

  setAsDefault(companySlug: string, branchSlug: string): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(API.BRANCH.SET_DEFAULT(companySlug, branchSlug), {});
  }
}