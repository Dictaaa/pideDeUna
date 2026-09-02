import { Component, OnDestroy, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OrderAdmin } from '../../../orders/services/order-admin';
import { Order } from '../../../../core/models/order.models';

const BUTTON_LABEL: Record<string, string> = {
  PENDING: 'Empezar a preparar',
  PREPARING: 'Marcar listo',
};

const REFRESH_MS = 8000;

@Component({
  selector: 'app-kitchen-board',
  standalone: true,
  templateUrl: './kitchen-board.html',
  styleUrl: './kitchen-board.scss',
})
export class KitchenBoard implements OnDestroy {
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderAdmin);

  slug = this.route.parent!.snapshot.paramMap.get('slug')!;

  loading = signal(true);
  orders = signal<Order[]>([]);
  advancingIds = signal<Set<string>>(new Set());

  private intervalId: ReturnType<typeof setInterval>;

  constructor() {
    this.reload();
    // Sin websockets todavía — se refresca sola cada 8s para que la
    // cocina vea pedidos nuevos sin tener que tocar la pantalla
    // (tiene las manos sucias, como bien dijiste).
    this.intervalId = setInterval(() => this.reload(true), REFRESH_MS);
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }

  reload(silent = false): void {
    if (!silent) this.loading.set(true);
    this.orderService.list(this.slug, 'active').subscribe({
      next: (orders) => {
        // Cocina solo necesita ver lo que todavía le toca a ella.
        this.orders.set(orders.filter((o) => o.status === 'PENDING' || o.status === 'PREPARING'));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  buttonLabel(order: Order): string {
    return BUTTON_LABEL[order.status] ?? '';
  }

  isAdvancing(order: Order): boolean {
    return this.advancingIds().has(order.id);
  }

  minutesWaiting(order: Order): number {
    return Math.max(0, Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000));
  }

  /** Más de 10 min esperando: se resalta para que no se quede atrás. */
  isUrgent(order: Order): boolean {
    return this.minutesWaiting(order) >= 10;
  }

    advance(order: Order): void {
    if (this.isAdvancing(order)) return;

    this.advancingIds.set(new Set([...this.advancingIds(), order.id]));

    this.orderService.advance(this.slug, order.id).subscribe({
      next: () => {
        this.releaseAdvancing(order.id);
        this.reload(true);
      },
      error: () => this.releaseAdvancing(order.id),
    });
  }

  private releaseAdvancing(orderId: string): void {
    const next = new Set(this.advancingIds());
    next.delete(orderId);
    this.advancingIds.set(next);
  }
}