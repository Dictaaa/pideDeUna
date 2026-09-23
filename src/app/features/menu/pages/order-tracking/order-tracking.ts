import { DecimalPipe } from '@angular/common';
import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CustomerOrderService } from '../../../../core/services/customer-order.service';
import { CompanyService } from '../../../../core/services/company.service';
import { SocketService } from '../../../../core/services/socket.service';
import { Order } from '../../../../core/models/order.model';
import { PublicCompanyInfo } from '../../../../core/models/company.model';
import { applyMenuFont } from '../../../../shared/utils/menu-fonts';
import { getSessionToken } from '../../utils/session-token-storage';

const SOCKET_SAFETY_POLL_MS = 30000; // por si el socket se cae sin avisar
const NO_SOCKET_POLL_MS = 5000; // sin token de sesión (ej. link compartido) — mismo intervalo que tenías antes

type Stage = 'PENDING' | 'PREPARING' | 'READY' | 'CANCELLED';
const STAGE_ORDER: Stage[] = ['PENDING', 'PREPARING', 'READY'];

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [DecimalPipe, RouterLink],
  templateUrl: './order-tracking.html',
  styleUrl: './order-tracking.scss',
})
export class OrderTracking implements OnDestroy {
  private route = inject(ActivatedRoute);
  private customerOrderService = inject(CustomerOrderService);
  private companyService = inject(CompanyService);
  private socket = inject(SocketService);

  companySlug = this.route.snapshot.paramMap.get('companySlug')!;
  branchSlug = this.route.snapshot.paramMap.get('branchSlug')!;
  orderId = this.route.snapshot.paramMap.get('orderId')!;

  loading = signal(true);
  order = signal<Order | null>(null);
  errorMessage = signal<string | null>(null);

  // Reaplica marca por si el cliente llegó directo a este link
  // (lo compartieron, recargó la pestaña) sin pasar por el menú antes.
  company = signal<PublicCompanyInfo | null>(null);
  branch = computed(() => this.company()?.restaurants.find((r) => r.slug === this.branchSlug) ?? null);

  private pollId: ReturnType<typeof setInterval> | null = null;
  private usingSocket = false;

  stage = computed<Stage>(() => {
    const s = this.order()?.status;
    if (s === 'CANCELLED') return 'CANCELLED';
    if (s === 'READY' || s === 'SERVED' || s === 'COMPLETED') return 'READY';
    if (s === 'PREPARING' || s === 'CONFIRMED') return 'PREPARING';
    return 'PENDING';
  });

  stageMessage = computed(() => {
    switch (this.stage()) {
      case 'PENDING':
        return 'Tu pedido llegó a cocina, en un momento lo empiezan a preparar.';
      case 'PREPARING':
        return 'Lo están preparando ahora mismo.';
      case 'READY':
        return '¡Listo! Ya te lo llevan a la mesa.';
      default:
        return '';
    }
  });

  constructor() {
    this.companyService.getPublicInfo(this.companySlug).subscribe({
      next: (c) => {
        this.company.set(c);
        document.documentElement.style.setProperty('--primary', c.primaryColor);
        document.documentElement.style.setProperty('--secondary', c.secondaryColor);
        applyMenuFont(c.fontFamily);
      },
    });

    this.reload();
    this.setupRealtime();
  }

  ngOnDestroy(): void {
    if (this.pollId) clearInterval(this.pollId);
    if (this.usingSocket) this.socket.disconnect();
  }

  /**
   * Si tenemos el token de sesión guardado (lo dejó MenuPage al
   * escanear el QR), las actualizaciones llegan al instante por
   * socket, con un poll cada 30s solo como red de seguridad. Si
   * alguien más abre este link compartido (sin el token en SU
   * navegador), sigue funcionando con polling normal cada 5s — más
   * lento, pero funciona igual gracias a trackOrder() siendo público.
   */
  private setupRealtime(): void {
    const token = getSessionToken(this.companySlug, this.branchSlug);
    if (!token) {
      this.startPolling(NO_SOCKET_POLL_MS);
      return;
    }

    this.usingSocket = true;
    this.socket.connectAsCustomer(token);

    this.socket.on<{ orderId: string }>('order:status_changed').subscribe((payload) => {
      if (payload.orderId === this.orderId) this.reload(true);
    });
    this.socket.on<{ orderId: string }>('order_item:kitchen_status_changed').subscribe((payload) => {
      if (payload.orderId === this.orderId) this.reload(true);
    });

    this.startPolling(SOCKET_SAFETY_POLL_MS);
  }

  private startPolling(ms: number): void {
    this.pollId = setInterval(() => this.reload(true), ms);
  }

  reload(silent = false): void {
    if (!silent) this.loading.set(true);
    this.customerOrderService.trackOrder(this.companySlug, this.branchSlug, this.orderId).subscribe({
      next: (order) => {
        this.order.set(order);
        this.loading.set(false);
        if ((order.status === 'COMPLETED' || order.status === 'CANCELLED') && this.pollId) {
          clearInterval(this.pollId);
          this.pollId = null;
        }
      },
      error: () => {
        this.errorMessage.set('No pudimos cargar el estado de tu pedido.');
        this.loading.set(false);
      },
    });
  }

  isStageActive(stage: Stage): boolean {
    const currentIndex = STAGE_ORDER.indexOf(this.stage());
    const stageIndex = STAGE_ORDER.indexOf(stage);
    if (currentIndex === -1 || stageIndex === -1) return false;
    return stageIndex <= currentIndex;
  }
}