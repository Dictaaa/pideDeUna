// src/app/core/services/customer-order.service.ts
//
// Lado CLIENTE (sin login) — arma el pedido escaneando el QR de la
// mesa. Todo acá usa el header X-Session-Token en vez de Authorization
// Bearer, así que authInterceptor NO le pone el JWT (ver la condición
// en auth.interceptor.ts: si ya trae X-Session-Token, lo deja pasar).
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API, CLIENT } from './api.endpoints';
import { CreateOrderAsCustomerInput, Order } from '../models/order.model';
import { QrResolveResponse } from '../models/table.model';
import { EffectiveProduct } from '../models/menu.model';
import { MenuCategory } from '../models/menu.model';
import { EffectivePromotion } from '../models/promotion.model';

@Injectable({ providedIn: 'root' })
export class CustomerOrderService {
  constructor(private http: HttpClient) {}

  private sessionHeaders(sessionToken: string) {
    return { headers: { 'X-Session-Token': sessionToken } };
  }

  /** Primer paso: el cliente escanea el QR fijo de la mesa. */
  resolveQr(companySlug: string, branchSlug: string, qrToken: string): Observable<QrResolveResponse> {
    return this.http.get<QrResolveResponse>(CLIENT.RESOLVE_QR(companySlug, branchSlug, qrToken));
  }

  // Menú/productos/promos efectivos de la sucursal — públicos, no
  // necesitan sessionToken (se pueden ver aunque el mesero no haya
  // abierto sesión todavía).
  getMenuCategories(companySlug: string, branchSlug: string): Observable<MenuCategory[]> {
    return this.http.get<MenuCategory[]>(API.BRANCH_MENU_CATEGORIES.LIST(companySlug, branchSlug));
  }

  getProducts(companySlug: string, branchSlug: string, categoryId?: string): Observable<EffectiveProduct[]> {
    const base = API.BRANCH_PRODUCTS.LIST(companySlug, branchSlug);
    const url = categoryId ? `${base}?categoryId=${categoryId}` : base;
    return this.http.get<EffectiveProduct[]>(url);
  }

  getPromotions(companySlug: string, branchSlug: string): Observable<EffectivePromotion[]> {
    return this.http.get<EffectivePromotion[]>(`${API.BRANCH_PROMOTIONS.LIST(companySlug, branchSlug)}?activeOnly=true`);
  }

  // A partir de acá SÍ hace falta el sessionToken (el mesero ya abrió la mesa).
  createOrder(companySlug: string, branchSlug: string, sessionToken: string, data: CreateOrderAsCustomerInput): Observable<Order> {
    return this.http.post<Order>(API.ORDERS.CREATE_PUBLIC(companySlug, branchSlug), data, this.sessionHeaders(sessionToken));
  }

  /** El pedido activo de la mesa — para pintar la pantalla en tiempo real. */
  getMyActiveOrder(companySlug: string, branchSlug: string, sessionToken: string): Observable<Order> {
    return this.http.get<Order>(API.ORDERS.MY_ACTIVE_ORDER(companySlug, branchSlug), this.sessionHeaders(sessionToken));
  }

  /** Seguimiento por ID — público, sin sessionToken (el UUID es el capability token). */
  trackOrder(companySlug: string, branchSlug: string, orderId: string): Observable<Order> {
    return this.http.get<Order>(API.ORDERS.TRACK(companySlug, branchSlug, orderId));
  }

  callWaiter(companySlug: string, branchSlug: string, sessionToken: string): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(CLIENT.CALL_WAITER(companySlug, branchSlug), {}, this.sessionHeaders(sessionToken));
  }
}