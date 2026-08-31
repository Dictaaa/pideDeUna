import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RestaurantMenuResponse } from '../models/menu.models';

/**
 * Wrapper delgado de HttpClient, siguiendo el mismo patrón ApiService
 * que en Desvare/Huellita: los componentes nunca llaman HttpClient
 * directamente, siempre pasan por aquí.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  /** GET /api/restaurantes/:slug/menu */
  getMenuBySlug(slug: string): Observable<RestaurantMenuResponse> {
    return this.http.get<RestaurantMenuResponse>(`${this.baseUrl}/restaurantes/${slug}/menu`);
  }
}