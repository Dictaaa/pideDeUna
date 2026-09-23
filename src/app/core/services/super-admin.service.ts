// src/app/core/services/super-admin.service.ts — SOLO SUPER_ADMIN.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API } from './api.endpoints';
import { CompanyStatus } from '../models/common.model';
import { Company, Plan, Subscription } from '../models/company.model';
import { Restaurant } from '../models/restaurant.model';
import { User } from '../models/user.model';

export interface CompanyWithSubscriptions extends Company {
  restaurants: Restaurant[];
  subscriptions: Subscription[];
}

export interface RestaurantWithCompany extends Restaurant {
  company: { id: string; slug: string; name: string };
}

export interface CompanyDetail {
  company: Company;
  restaurants: Restaurant[];
  subscription: Subscription | null;
  usage: { products: number; tables: number; users: number; branches: number; storageMb: number };
  users: User[];
}

@Injectable({ providedIn: 'root' })
export class SuperAdminCompanyService {
  constructor(private http: HttpClient) {}

  list(): Observable<CompanyWithSubscriptions[]> {
    return this.http.get<CompanyWithSubscriptions[]>(API.COMPANIES_ADMIN.LIST());
  }

  create(data: { name: string; slug: string; nit?: string; restaurantName: string; restaurantSlug: string }): Observable<{ company: Company; restaurant: Restaurant }> {
    return this.http.post<{ company: Company; restaurant: Restaurant }>(API.COMPANIES_ADMIN.CREATE(), data);
  }

  updateStatus(id: string, status: CompanyStatus): Observable<Company> {
    return this.http.patch<Company>(API.COMPANIES_ADMIN.UPDATE_STATUS(id), { status });
  }

  getDetail(id: string): Observable<CompanyDetail> {
    return this.http.get<CompanyDetail>(API.COMPANIES_ADMIN.DETAIL(id));
  }

  changePlan(id: string, planId: string): Observable<Subscription> {
    return this.http.post<Subscription>(API.COMPANIES_ADMIN.CHANGE_PLAN(id), { planId });
  }

  /** El primer usuario administrador de una compañía recién creada — create() de la compañía no crea usuarios. */
  createAdminUser(id: string, data: { name: string; email: string; password: string }): Observable<User> {
    return this.http.post<User>(API.COMPANIES_ADMIN.CREATE_ADMIN_USER(id), data);
  }
}

@Injectable({ providedIn: 'root' })
export class SuperAdminRestaurantService {
  constructor(private http: HttpClient) {}

  list(): Observable<RestaurantWithCompany[]> {
    return this.http.get<RestaurantWithCompany[]>(API.RESTAURANTS_ADMIN.LIST());
  }
}

@Injectable({ providedIn: 'root' })
export class PlanService {
  constructor(private http: HttpClient) {}

  /** Público — se necesita para mostrar precios/planes disponibles en el sitio de marketing. */
  list(): Observable<Plan[]> {
    return this.http.get<Plan[]>(API.PLANS.LIST());
  }

  create(data: Partial<Plan>): Observable<Plan> {
    return this.http.post<Plan>(API.PLANS.CREATE(), data);
  }

  update(id: string, patch: Partial<Plan>): Observable<Plan> {
    return this.http.patch<Plan>(API.PLANS.UPDATE(id), patch);
  }
}