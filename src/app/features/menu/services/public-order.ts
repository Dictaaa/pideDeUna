import { Injectable, inject } from '@angular/core';
import { Api } from '../../../core/services/api';
import { API } from '../../../core/services/api.endpoints';
import {
  PublicOrderComboInput,
  PublicOrderItemInput,
  PublicOrderResult,
  PublicOrderStatus,
  SessionInfo,
} from '../models/public-order.models';

@Injectable({ providedIn: 'root' })
export class PublicOrderService {
  private api = inject(Api);

  /** ¿Esta mesa está abierta para pedir ahora mismo? El QR físico nunca cambia — esto sí. */
  getSessionInfo(slug: string, token: string) {
    return this.api.get<SessionInfo>(API.PUBLIC_ORDER.SESSION_INFO(slug, token));
  }

  createOrder(
    slug: string,
    token: string,
    payload: { customerName: string; items: PublicOrderItemInput[]; combos?: PublicOrderComboInput[] }
  ) {
    return this.api.post<PublicOrderResult>(API.PUBLIC_ORDER.CREATE(slug, token), payload);
  }

  getStatus(slug: string, orderId: string) {
    return this.api.get<PublicOrderStatus>(API.PUBLIC_ORDER.STATUS(slug, orderId));
  }
}