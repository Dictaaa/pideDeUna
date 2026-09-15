import { Injectable, inject } from '@angular/core';
import { Api } from '../../../core/services/api';
import { API } from '../../../core/services/api.endpoints';
import { CreateOrderItemInput, CreateOrderPayload, Invoice, Order } from '../../../core/models/order.models';

@Injectable({ providedIn: 'root' })
export class OrderAdmin {
  private api = inject(Api);

  /** status: 'active' (default, lo que ve mesera/cocina) | 'all' | un estado puntual */
  list(slug: string, status: string = 'active', from?: string, to?: string) {
    const params: Record<string, string> = { status };
    if (from) params['from'] = from;
    if (to) params['to'] = to;
    return this.api.get<Order[]>(API.ORDERS.LIST(slug), params);
  }
  create(slug: string, payload: CreateOrderPayload) {
    return this.api.post<Order>(API.ORDERS.CREATE(slug), payload);
  }
  addItem(slug: string, orderId: string, item: CreateOrderItemInput) {
    return this.api.post<Order>(API.ORDERS.ADD_ITEM(slug, orderId), item);
  }

  /** Agrega un combo de promoción — selections: cuánto de cada producto (la suma debe dar el buyQuantity del combo). */
  addCombo(slug: string, orderId: string, promotionId: string, selections: { productId: string; quantity: number }[]) {
    return this.api.post<Order>(API.ORDERS.ADD_COMBO(slug, orderId), { promotionId, selections });
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
  /** La MESERA entrega el plato en la mesa: READY -> SERVED. No cobra nada. */
  serve(slug: string, orderId: string) {
    return this.api.post<Order>(API.ORDERS.SERVE(slug, orderId), {});
  }

  /**
   * La CAJERA cobra y cierra el pedido: SERVED -> COMPLETED.
   * paymentMethod es obligatorio; transactionReference es la referencia
   * de un pago externo (datáfono/Wompi/ePayco) — opcional, la ingresa
   * quien cobra, no la mesera.
   */
  charge(slug: string, orderId: string, payload: { paymentMethod: string; transactionReference?: string; includeTip?: boolean }) {
    return this.api.post<Order>(API.ORDERS.CHARGE(slug, orderId), payload);
  }

  /** El recibo imprimible — solo existe una vez que caja ya cobró. */
  getInvoice(slug: string, orderId: string) {
    return this.api.get<Invoice>(API.ORDERS.INVOICE(slug, orderId));
  }
}