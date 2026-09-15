import { DecimalPipe } from '@angular/common';
import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Menu } from '../../services/menu';
import { PublicOrderService } from '../../services/public-order';
import { PublicOrderStatus } from '../../models/public-order.models';
import { Restaurant } from '../../../../core/models/menu';
import { applyMenuFont } from '../../../../shared/utils/menu-fonts';

const POLL_MS = 5000;

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
  private menuService = inject(Menu);
  private orderService = inject(PublicOrderService);

  slug = this.route.snapshot.paramMap.get('slug')!;
  orderId = this.route.snapshot.paramMap.get('orderId')!;

  loading = signal(true);
  status = signal<PublicOrderStatus | null>(null);
  errorMessage = signal<string | null>(null);
  restaurant = signal<Restaurant | null>(null);

  private intervalId: ReturnType<typeof setInterval>;

  stage = computed<Stage>(() => {
    const s = this.status()?.status;
    if (s === 'CANCELLED') return 'CANCELLED';
    if (s === 'READY' || s === 'SERVED' || s === 'COMPLETED') return 'READY';
    if (s === 'PREPARING') return 'PREPARING';
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
    // Reaplica el color/tipografía/nombre de marca por si el cliente
    // llegó directo a esta página (compartieron el link, recargó, etc.)
    // sin pasar por el menú primero en esta pestaña.
    this.menuService.getBySlug(this.slug).subscribe({
      next: (res) => {
        this.restaurant.set(res.restaurant);
        document.documentElement.style.setProperty('--primary', res.restaurant.primaryColor);
        document.documentElement.style.setProperty('--secondary', res.restaurant.secondaryColor);
        applyMenuFont(res.restaurant.fontFamily);
      },
    });

    this.reload();
    this.intervalId = setInterval(() => this.reload(true), POLL_MS);
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }

  reload(silent = false): void {
    if (!silent) this.loading.set(true);
    this.orderService.getStatus(this.slug, this.orderId).subscribe({
      next: (status) => {
        this.status.set(status);
        this.loading.set(false);
        if (['READY', 'SERVED', 'COMPLETED', 'CANCELLED'].includes(status.status)) {
          clearInterval(this.intervalId);
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