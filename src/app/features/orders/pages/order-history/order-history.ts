import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { OrderService } from '../../../../core/services/order.service';
import { Invoice, Order, OrderItem } from '../../../../core/models/order.model';
import { OrderStatus } from '../../../../core/models/common.model';
import { TableSkeleton } from '../../../../shared/components/table-skeleton/table-skeleton';

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  PREPARING: 'En cocina',
  READY: 'Listo',
  SERVED: 'Entregado',
  COMPLETED: 'Cobrado',
  CANCELLED: 'Cancelado',
};

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [FormsModule, DecimalPipe, TableSkeleton],
  templateUrl: './order-history.html',
  styleUrl: './order-history.scss',
})
export class OrderHistory {
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);

  companySlug = this.route.snapshot.paramMap.get('companySlug')!;
  branchSlug = this.route.snapshot.paramMap.get('branchSlug')!;

  statusLabel = (s: string) => STATUS_LABELS[s as OrderStatus] ?? s;

  loading = signal(true);
  // Solo lo YA CERRADO — lo demás vive en Pedidos/Cocina/Caja, no acá.
  orders = signal<Order[]>([]);
  fromDate = signal('');
  toDate = signal('');

  selectedOrder = signal<Order | null>(null);
  errorMessage = signal<string | null>(null);

  printingInvoice = signal<Invoice | null>(null);
  loadingInvoice = signal(false);

  constructor() {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.orderService
      .list(this.companySlug, this.branchSlug, ['COMPLETED', 'CANCELLED'], {
        from: this.fromDate() || undefined,
        to: this.toDate() || undefined,
      })
      .subscribe({
        next: (orders) => {
          this.orders.set(orders);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  applyFilter(): void {
    this.reload();
  }

  clearFilter(): void {
    this.fromDate.set('');
    this.toDate.set('');
    this.reload();
  }

  openOrder(order: Order): void {
    this.selectedOrder.set(order);
    this.errorMessage.set(null);
  }

  closePanel(): void {
    this.selectedOrder.set(null);
  }

  modifierNamesLabel(item: OrderItem): string {
    return (item.modifiers ?? []).map((m) => m.modifierName).join(', ');
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

  /** Solo para pedidos COMPLETED — trae el recibo en JSON y lo muestra en pantalla. */
  viewInvoice(order: Order): void {
    this.loadingInvoice.set(true);
    this.errorMessage.set(null);

    this.orderService.getInvoice(this.companySlug, this.branchSlug, order.id).subscribe({
      next: (invoice) => {
        this.loadingInvoice.set(false);
        this.printingInvoice.set(invoice);
      },
      error: (err) => {
        this.loadingInvoice.set(false);
        this.errorMessage.set(err?.error?.error || 'No se pudo cargar la factura.');
      },
    });
  }

  printInvoice(): void {
    window.print();
  }

  closeInvoice(): void {
    this.printingInvoice.set(null);
  }
}