// src/app/core/services/table.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API } from './api.endpoints';
import { RestaurantArea } from '../models/restaurant.model';
import { RestaurantTable, TableQrCode, TableSession, WaiterCall } from '../models/table.model';

@Injectable({ providedIn: 'root' })
export class AreaService {
  constructor(private http: HttpClient) {}

  list(companySlug: string, branchSlug: string): Observable<RestaurantArea[]> {
    return this.http.get<RestaurantArea[]>(API.AREAS.LIST(companySlug, branchSlug));
  }

  create(companySlug: string, branchSlug: string, data: { name: string; description?: string; sortOrder?: number; isActive?: boolean }): Observable<RestaurantArea> {
    return this.http.post<RestaurantArea>(API.AREAS.CREATE(companySlug, branchSlug), data);
  }

  update(companySlug: string, branchSlug: string, id: string, patch: Partial<RestaurantArea>): Observable<RestaurantArea> {
    return this.http.patch<RestaurantArea>(API.AREAS.UPDATE(companySlug, branchSlug, id), patch);
  }

  remove(companySlug: string, branchSlug: string, id: string): Observable<void> {
    return this.http.delete<void>(API.AREAS.REMOVE(companySlug, branchSlug, id));
  }
}

@Injectable({ providedIn: 'root' })
export class TableService {
  constructor(private http: HttpClient) {}

  /** Trae TODAS las mesas de la sucursal, cada una con su sesión OPEN si tiene. */
  list(companySlug: string, branchSlug: string): Observable<RestaurantTable[]> {
    return this.http.get<RestaurantTable[]>(API.TABLES.LIST(companySlug, branchSlug));
  }

  create(companySlug: string, branchSlug: string, data: { tableNumber: string; name?: string; capacity?: number; areaId?: string }): Observable<{ table: RestaurantTable; qr: unknown }> {
    return this.http.post<{ table: RestaurantTable; qr: unknown }>(API.TABLES.CREATE(companySlug, branchSlug), data);
  }

  update(companySlug: string, branchSlug: string, id: string, patch: Partial<RestaurantTable>): Observable<RestaurantTable> {
    return this.http.patch<RestaurantTable>(API.TABLES.UPDATE(companySlug, branchSlug, id), patch);
  }

  remove(companySlug: string, branchSlug: string, id: string): Observable<void> {
    return this.http.delete<void>(API.TABLES.REMOVE(companySlug, branchSlug, id));
  }

  /** El mesero abre sesión en la mesa — esto genera el token que autoriza al cliente a pedir. */
  openSession(companySlug: string, branchSlug: string, tableId: string, guestCount?: number): Observable<TableSession> {
    return this.http.post<TableSession>(API.TABLES.OPEN_SESSION(companySlug, branchSlug, tableId), { guestCount });
  }

  /** Desactiva el QR impreso actual (deja de servir) y genera uno nuevo — para cuando se pierde o se compromete. */
  regenerateQr(companySlug: string, branchSlug: string, tableId: string): Observable<TableQrCode> {
    return this.http.post<TableQrCode>(API.TABLES.REGENERATE_QR(companySlug, branchSlug, tableId), {});
  }
}

@Injectable({ providedIn: 'root' })
export class TableSessionService {
  constructor(private http: HttpClient) {}

  /** Cierra la sesión (libera la mesa) — invalida el token del cliente. */
  close(companySlug: string, branchSlug: string, id: string): Observable<TableSession> {
    return this.http.post<TableSession>(API.TABLE_SESSIONS.CLOSE(companySlug, branchSlug, id), {});
  }
}

@Injectable({ providedIn: 'root' })
export class WaiterCallService {
  constructor(private http: HttpClient) {}

  /** El cliente llama al mesero desde su mesa (sin login — ver customer-order.service.ts). */
  callFromTable(companySlug: string, branchSlug: string, tableId: string): Observable<WaiterCall> {
    return this.http.post<WaiterCall>(API.TABLES.CALL_WAITER(companySlug, branchSlug, tableId), {});
  }

  list(companySlug: string, branchSlug: string, status?: string): Observable<WaiterCall[]> {
    const url = status ? `${API.WAITER_CALLS.LIST(companySlug, branchSlug)}?status=${status}` : API.WAITER_CALLS.LIST(companySlug, branchSlug);
    return this.http.get<WaiterCall[]>(url);
  }

  attend(companySlug: string, branchSlug: string, id: string): Observable<WaiterCall> {
    return this.http.patch<WaiterCall>(API.WAITER_CALLS.ATTEND(companySlug, branchSlug, id), {});
  }
}