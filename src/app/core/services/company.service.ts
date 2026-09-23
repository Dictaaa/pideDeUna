// src/app/core/services/company.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API } from './api.endpoints';
import { Company, CompanySettings, CompanyUsage, PublicCompanyInfo, StorageUsage, Subscription } from '../models/company.model';
import { Restaurant } from '../models/restaurant.model';

@Injectable({ providedIn: 'root' })
export class CompanyService {
  constructor(private http: HttpClient) {}

  getDetail(companySlug: string): Observable<Company> {
    return this.http.get<Company>(API.COMPANY.DETAIL(companySlug));
  }

  getPublicInfo(companySlug: string): Observable<PublicCompanyInfo> {
    return this.http.get<PublicCompanyInfo>(API.COMPANY.PUBLIC_INFO(companySlug));
  }

  update(companySlug: string, patch: Partial<Pick<Company, 'name' | 'nit' | 'primaryColor' | 'secondaryColor' | 'fontFamily'>>): Observable<Company> {
    return this.http.patch<Company>(API.COMPANY.UPDATE(companySlug), patch);
  }

  updateSettings(companySlug: string, patch: { taxLabel?: string; taxRate?: number; tipRate?: number; allowTips?: boolean }): Observable<unknown> {
    return this.http.patch(API.COMPANY.UPDATE_SETTINGS(companySlug), patch);
  }

  getSettings(companySlug: string): Observable<CompanySettings> {
    return this.http.get<CompanySettings>(API.COMPANY.GET_SETTINGS(companySlug));
  }

  uploadLogo(companySlug: string, file: File): Observable<{ logoUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ logoUrl: string }>(API.COMPANY.UPLOAD_LOGO(companySlug), formData);
  }

  getStorageUsage(companySlug: string): Observable<StorageUsage> {
    return this.http.get<StorageUsage>(API.COMPANY.STORAGE_USAGE(companySlug));
  }

  getUsage(companySlug: string): Observable<CompanyUsage> {
    return this.http.get<CompanyUsage>(API.COMPANY.USAGE(companySlug));
  }

  changePlan(companySlug: string, planId: string): Observable<Subscription> {
    return this.http.post<Subscription>(API.COMPANY.CHANGE_PLAN(companySlug), { planId });
  }

  listRestaurants(companySlug: string): Observable<Restaurant[]> {
    return this.http.get<Restaurant[]>(API.COMPANY_RESTAURANTS.LIST(companySlug));
  }

  createRestaurant(companySlug: string, data: Partial<Restaurant>): Observable<Restaurant> {
    return this.http.post<Restaurant>(API.COMPANY_RESTAURANTS.CREATE(companySlug), data);
  }
}