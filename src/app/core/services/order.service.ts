// src/app/core/services/order.service.ts — lado STAFF (JWT).
// El lado cliente (sin login) vive en customer-order.service.ts.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API } from './api.endpoints';
import { OrderStatus } from '../models/common.model';
import {
  ChargeOrderInput, CreateComboInput, CreateOrderAsStaffInput, CreateOrderItemInput,
  Invoice, Order,
} from '../models/order.model';
import { Payment } from '../models/payment.model';

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: 'PREPARING', // cocina salta CONFIRMED — no lo usa
  PREPARING: 'READY',
};

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private http: HttpClient) {}

  list(companySlug: string, branchSlug: string, statuses?: OrderStatus[], dateRange?: { from?: string; to?: string }): Observable<Order[]> {
    const params = new URLSearchParams();
    if (statuses?.length) params.set('status', statuses.join(','));
    if (dateRange?.from) params.set('from', dateRange.from);
    if (dateRange?.to) params.set('to', dateRange.to);
    const qs = params.toString();
    const base = API.ORDERS.LIST(companySlug, branchSlug);
    return this.http.get<Order[]>(qs ? `${base}?${qs}` : base);
  }

  detail(companySlug: string, branchSlug: string, id: string): Observable<Order> {
    return this.http.get<Order>(API.ORDERS.DETAIL(companySlug, branchSlug, id));
  }

  /** Pedido telefónico/take-away, o DINE_IN que el mesero digita a nombre del cliente. */
  createAsStaff(companySlug: string, branchSlug: string, data: CreateOrderAsStaffInput): Observable<Order> {
    return this.http.post<Order>(API.ORDERS.CREATE_STAFF(companySlug, branchSlug), data);
  }

  updateStatus(companySlug: string, branchSlug: string, id: string, status: OrderStatus): Observable<Order> {
    return this.http.patch<Order>(API.ORDERS.UPDATE_STATUS(companySlug, branchSlug, id), { status });
  }

  /** Botón único de cocina: PENDING->PREPARING, PREPARING->READY. No sirve para READY en adelante. */
  advance(companySlug: string, branchSlug: string, order: Order): Observable<Order> {
    const next = NEXT_STATUS[order.status];
    if (!next) throw new Error(`No hay "siguiente estado" definido para ${order.status}.`);
    return this.updateStatus(companySlug, branchSlug, order.id, next);
  }

  cancel(companySlug: string, branchSlug: string, id: string): Observable<Order> {
    return this.updateStatus(companySlug, branchSlug, id, 'CANCELLED');
  }

  /** La mesera marca que ya entregó el plato (READY -> SERVED). */
  serve(companySlug: string, branchSlug: string, id: string): Observable<Order> {
    return this.updateStatus(companySlug, branchSlug, id, 'SERVED');
  }

  /** Cocinero se autoasigna — 409 si ya lo tomó otro. */
  claim(companySlug: string, branchSlug: string, id: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(API.ORDERS.CLAIM(companySlug, branchSlug, id), {});
  }

  /** Solo admin — reemplaza la asignación completa (uno para reasignar, varios para repartir entre cocineros). */
  assign(companySlug: string, branchSlug: string, id: string, userIds: string[]): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(API.ORDERS.ASSIGN(companySlug, branchSlug, id), { userIds });
  }

  /** Agrega un producto a una orden YA CREADA (ej. el cliente pide algo más antes de cerrar cuenta). */
  addItem(companySlug: string, branchSlug: string, orderId: string, item: CreateOrderItemInput): Observable<Order> {
    return this.http.post<Order>(API.ORDERS.ADD_ITEM(companySlug, branchSlug, orderId), item);
  }

  /** Agrega un combo a una orden YA CREADA. */
  addCombo(companySlug: string, branchSlug: string, orderId: string, combo: CreateComboInput): Observable<Order> {
    return this.http.post<Order>(API.ORDERS.ADD_COMBO(companySlug, branchSlug, orderId), combo);
  }

  removeItem(companySlug: string, branchSlug: string, orderId: string, itemId: string): Observable<Order> {
    return this.http.delete<Order>(API.ORDERS.REMOVE_ITEM(companySlug, branchSlug, orderId, itemId));
  }

  /**
   * Cobro atómico: pago + orden a COMPLETED en una sola transacción del
   * lado del servidor — el monto de impuesto/propina lo calcula el
   * backend (branch/company settings), el frontend solo dice si se
   * incluye propina o no.
   */
  charge(companySlug: string, branchSlug: string, id: string, data: ChargeOrderInput): Observable<{ order: Order; payment: Payment }> {
    return this.http.post<{ order: Order; payment: Payment }>(API.ORDERS.CHARGE(companySlug, branchSlug, id), data);
  }

  /** Recibo en JSON, para mostrarlo en pantalla antes de imprimir (window.print()). */
  getInvoice(companySlug: string, branchSlug: string, orderId: string): Observable<Invoice> {
    return this.http.get<Invoice>(API.ORDERS.INVOICE_JSON(companySlug, branchSlug, orderId));
  }
}

@Injectable({ providedIn: 'root' })
export class KitchenService {
  constructor(private http: HttpClient) {}

  /** Cola de cocina — el backend ya filtra: sin asignar (todos la ven) / asignado a mí / asignado a otro (no aparece), salvo admin. */
  getQueue(companySlug: string, branchSlug: string): Observable<Order[]> {
    return this.http.get<Order[]>(API.KITCHEN.QUEUE(companySlug, branchSlug));
  }

  updateItemStatus(companySlug: string, branchSlug: string, orderItemId: string, status: string): Observable<unknown> {
    return this.http.patch(API.ORDER_ITEMS.UPDATE_KITCHEN_STATUS(companySlug, branchSlug, orderItemId), { status });
  }
}