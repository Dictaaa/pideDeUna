import { Component, OnDestroy, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { OrderService } from '../../../../core/services/order.service';
import { CompanyService } from '../../../../core/services/company.service';
import { RestaurantService } from '../../../../core/services/restaurant.service';
import { SocketService } from '../../../../core/services/socket.service';
import { TokenStorageService } from '../../../../core/services/token-storage.service';
import { Invoice, Order } from '../../../../core/models/order.model';

// Mismas opciones que tenía Pedidos — no procesamos el cobro de
// verdad, solo lo registramos.
const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Efectivo' },
  { value: 'CARD', label: 'Tarjeta (datáfono aparte)' },
  { value: 'TRANSFER', label: 'Transferencia' },
  { value: 'WOMPI', label: 'Wompi' },
  { value: 'EPAYCO', label: 'ePayco' },
  { value: 'OTHER', label: 'Otro' },
];

const SOCKET_SAFETY_POLL_MS = 30000; // el socket hace el trabajo — esto es solo por si se cae

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './caja.html',
  styleUrl: './caja.scss',
})
export class Caja implements OnDestroy {
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);
  private companyService = inject(CompanyService);
  private restaurantService = inject(RestaurantService);
  private socket = inject(SocketService);
  private tokenStorage = inject(TokenStorageService);
  private intervalId: ReturnType<typeof setInterval>;

  companySlug = this.route.snapshot.paramMap.get('companySlug')!;
  branchSlug = this.route.snapshot.paramMap.get('branchSlug')!;

  paymentMethods = PAYMENT_METHODS;

  loading = signal(true);
  // Solo SERVED — lo que la mesera ya entregó y está esperando cobro.
  orders = signal<Order[]>([]);

  panelOpen = signal(false);
  activeOrder = signal<Order | null>(null);

  paymentMethod = signal('CASH');
  paymentReference = signal('');
  charging = signal(false);
  errorMessage = signal<string | null>(null);

  // Propina EFECTIVA: la de la sucursal pisa a la de la compañía si no es null.
  tipsAllowed = signal(false);
  tipRate = signal(0);
  includeTip = signal(true);

  // El recibo, listo para imprimir, justo después de cobrar.
  printingInvoice = signal<Invoice | null>(null);
  loadingInvoice = signal(false);

  constructor() {
    this.reload();

    forkJoin({
      company: this.companyService.getSettings(this.companySlug),
      branch: this.restaurantService.getSettings(this.companySlug, this.branchSlug),
    }).subscribe({
      next: ({ company, branch }) => {
        this.tipsAllowed.set(branch.allowTips ?? company.allowTips);
        this.tipRate.set(Number(branch.tipRate ?? company.tipRate));
      },
      error: (err) => console.error('[Caja] No se pudo cargar la configuración de propina:', err),
    });

    // Socket para tiempo real — un pedido que la mesera marca SERVED
    // aparece acá al instante. El poll de abajo queda solo como red de
    // seguridad, mucho más espaciado, por si el socket se cae.
    const token = this.tokenStorage.getToken();
    if (token) {
      this.socket.connectAsStaff(token);
      this.socket.on<{ orderId: string; status: string }>('order:status_changed').subscribe(() => this.reload(true));
    }

    this.intervalId = setInterval(() => this.reload(true), SOCKET_SAFETY_POLL_MS);
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
    this.socket.disconnect();
  }

  reload(silent = false): void {
    if (!silent) this.loading.set(true);
    this.orderService.list(this.companySlug, this.branchSlug, ['SERVED']).subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.loading.set(false);
        const current = this.activeOrder();
        if (current && !orders.find((o) => o.id === current.id)) {
          this.panelOpen.set(false); // alguien más ya lo cobró — se cierra solo
        }
      },
      error: () => this.loading.set(false),
    });
  }

  timeAgo(dateStr: string): string {
    const minutes = Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000));
    if (minutes < 1) return 'ahora mismo';
    if (minutes === 1) return 'hace 1 min';
    return `hace ${minutes} min`;
  }

  openCharge(order: Order): void {
    this.activeOrder.set(order);
    this.paymentMethod.set('CASH');
    this.paymentReference.set('');
    this.errorMessage.set(null);
    this.panelOpen.set(true);
  }

  closePanel(): void {
    this.panelOpen.set(false);
  }

  /** Cobro atómico — el backend calcula impuesto/propina y genera la factura en la misma transacción. */
  confirmCharge(): void {
    const order = this.activeOrder();
    if (!order) return;

    this.charging.set(true);
    this.errorMessage.set(null);

    this.orderService
      .charge(this.companySlug, this.branchSlug, order.id, {
        paymentMethod: this.paymentMethod(),
        transactionReference: this.paymentReference().trim() || undefined,
        includeTip: this.tipsAllowed() ? this.includeTip() : false,
      })
      .subscribe({
        next: (result) => {
          this.charging.set(false);
          this.panelOpen.set(false);
          this.reload();
          this.showInvoiceFor(result.order);
        },
        error: (err) => {
          this.charging.set(false);
          this.errorMessage.set(err?.error?.error || 'No se pudo registrar el cobro.');
        },
      });
  }

  private showInvoiceFor(order: Order): void {
    this.loadingInvoice.set(true);
    this.orderService.getInvoice(this.companySlug, this.branchSlug, order.id).subscribe({
      next: (invoice) => {
        this.loadingInvoice.set(false);
        this.printingInvoice.set(invoice);
      },
      error: () => this.loadingInvoice.set(false),
    });
  }

  printInvoice(): void {
    window.print();
  }

  closeInvoice(): void {
    this.printingInvoice.set(null);
  }

  formatInvoiceDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
}