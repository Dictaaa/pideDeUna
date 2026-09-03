import { Injectable, inject } from '@angular/core';
import { Api } from '../../../core/services/api';
import { API } from '../../../core/services/api.endpoints';
import { CreateOrderItemInput, CreateOrderPayload, Order } from '../../../core/models/order.models';

@Injectable({ providedIn: 'root' })
export class OrderAdmin {
  private api = inject(Api);

  /** status: 'active' (default, lo que ve mesera/cocina) | 'all' | un estado puntual */
  list(slug: string, status: string = 'active') {
    return this.api.get<Order[]>(API.ORDERS.LIST(slug), { status });
  }
  create(slug: string, payload: CreateOrderPayload) {
    return this.api.post<Order>(API.ORDERS.CREATE(slug), payload);
  }
  addItem(slug: string, orderId: string, item: CreateOrderItemInput) {
    return this.api.post<Order>(API.ORDERS.ADD_ITEM(slug, orderId), item);
  }
  removeItem(slug: string, orderId: string, itemId: string) {
    return this.api.delete<Order>(API.ORDERS.REMOVE_ITEM(slug, orderId, itemId));
  }
  cancel(slug: string, orderId: string) {
    return this.api.post<Order>(API.ORDERS.CANCEL(slug, orderId), {});
  }
  /** El único botón de cocina: PENDING -> PREPARING -> READY. */
  advance(slug: string, orderId: string) {
    return this.api.post<Order>(API.ORDERS.ADVANCE(slug, orderId), {});
  }
    /**
   * La mesera cobra y cierra el pedido: READY -> COMPLETED.
   * paymentMethod es obligatorio; transactionReference (el número de
   * factura del datáfono, Wompi, ePayco, etc.) es opcional.
   */
  serve(slug: string, orderId: string, payload: { paymentMethod: string; transactionReference?: string }) {
    return this.api.post<Order>(API.ORDERS.SERVE(slug, orderId), payload);
  }
}