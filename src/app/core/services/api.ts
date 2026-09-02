import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

/**
 * Wrapper delgado de HttpClient — nadie más en la app llama HttpClient
 * directamente, siempre pasan por acá. Las URLs completas viven en
 * api.endpoints.ts (API.RESTAURANT.MENU(slug), etc.); este servicio
 * no arma rutas, solo las ejecuta.
 */
@Injectable({ providedIn: 'root' })
export class Api {
  private http = inject(HttpClient);

  get<T>(url: string, params?: Record<string, string | number | boolean>) {
    return this.http.get<T>(url, { params: params as any });
  }
  post<T>(url: string, body: unknown) {
    return this.http.post<T>(url, body);
  }
  patch<T>(url: string, body: unknown) {
    return this.http.patch<T>(url, body);
  }
  put<T>(url: string, body: unknown) {
    return this.http.put<T>(url, body);
  }
  delete<T>(url: string) {
    return this.http.delete<T>(url);
  }
}
