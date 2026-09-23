import { Component, OnDestroy, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { OrderService, KitchenService } from '../../../../core/services/order.service';
import { SocketService } from '../../../../core/services/socket.service';
import { TokenStorageService } from '../../../../core/services/token-storage.service';
import { Order, OrderItem } from '../../../../core/models/order.model';

const BUTTON_LABEL: Record<string, string> = {
  PENDING: 'Empezar a preparar',
  PREPARING: 'Marcar listo',
};

const SOCKET_SAFETY_POLL_MS = 30000; // el socket hace el trabajo — esto es solo por si se cae

@Component({
  selector: 'app-kitchen-board',
  standalone: true,
  templateUrl: './kitchen-board.html',
  styleUrl: './kitchen-board.scss',
})
export class KitchenBoard implements OnDestroy {
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  private orderService = inject(OrderService);
  private kitchenService = inject(KitchenService);
  private socket = inject(SocketService);
  private tokenStorage = inject(TokenStorageService);

  // Con paramsInheritanceStrategy: 'always', companySlug llega heredado
  // del padre sin tener que subir con route.parent.
  companySlug = this.route.snapshot.paramMap.get('companySlug')!;
  branchSlug = this.route.snapshot.paramMap.get('branchSlug')!;

  loading = signal(true);
  orders = signal<Order[]>([]);
  advancingIds = signal<Set<string>>(new Set());
  claimingIds = signal<Set<string>>(new Set());

  private intervalId: ReturnType<typeof setInterval>;

  constructor() {
    this.reload();

    // Socket para tiempo real: pedido nuevo, otro cocinero lo reclama
    // o cambia de estado. El poll de abajo queda solo como red de
    // seguridad, mucho más espaciado, por si el socket se cae.
    const token = this.tokenStorage.getToken();
    if (token) {
      this.socket.connectAsStaff(token);
      this.socket.on<{ orderId: string }>('order:created').subscribe(() => this.reload(true));
      this.socket.on<{ orderId: string; status: string }>('order:status_changed').subscribe(() => this.reload(true));
      this.socket.on<{ orderId: string }>('order:kitchen_assignment_changed').subscribe(() => this.reload(true));
    }

    this.intervalId = setInterval(() => this.reload(true), SOCKET_SAFETY_POLL_MS);
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
    this.socket.disconnect();
  }

  reload(silent = false): void {
    if (!silent) this.loading.set(true);
    // getQueue() ya filtra: sin asignar (todos la ven) / asignado a mí
    // (la veo) / asignado a otro (no aparece) — salvo que sea admin.
    this.kitchenService.getQueue(this.companySlug, this.branchSlug).subscribe({
      next: (orders) => {
        this.orders.set(orders.filter((o) => o.status === 'PENDING' || o.status === 'PREPARING'));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  buttonLabel(order: Order): string {
    return BUTTON_LABEL[order.status] ?? '';
  }

  modifierNamesLabel(item: OrderItem): string {
    return (item.modifiers ?? []).map((m) => m.modifierName).join(', ');
  }

  isAdvancing(order: Order): boolean {
    return this.advancingIds().has(order.id);
  }

  isClaiming(order: Order): boolean {
    return this.claimingIds().has(order.id);
  }

  /** Sin cocinero asignado todavía — cualquiera puede tomarlo. */
  isUnclaimed(order: Order): boolean {
    return (order.assignedCooks?.length ?? 0) === 0;
  }

  /** Ya lo tengo asignado a mí — puedo avanzarlo. */
  isMine(order: Order): boolean {
    const me = this.auth.getDecodedToken()?.sub;
    return (order.assignedCooks ?? []).some((c) => c.id === me);
  }

  claim(order: Order): void {
    if (this.isClaiming(order)) return;
    this.claimingIds.set(new Set([...this.claimingIds(), order.id]));

    this.orderService.claim(this.companySlug, this.branchSlug, order.id).subscribe({
      next: () => {
        this.releaseClaiming(order.id);
        this.reload(true);
      },
      error: () => this.releaseClaiming(order.id), // 409 = ya lo tomó otro — el reload lo va a quitar de la lista
    });
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

    this.orderService.advance(this.companySlug, this.branchSlug, order).subscribe({
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

  private releaseClaiming(orderId: string): void {
    const next = new Set(this.claimingIds());
    next.delete(orderId);
    this.claimingIds.set(next);
  }
}