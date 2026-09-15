import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { OrderAdmin } from '../../services/order-admin';
import { Order, Invoice } from '../../../../core/models/order.models';
import { TableSkeleton } from '../../../../shared/components/table-skeleton/table-skeleton';

const STATUS_LABELS: Record<string, string> = {
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
  private orderService = inject(OrderAdmin);

  slug = this.route.parent!.snapshot.paramMap.get('slug')!;
  statusLabel = (s: string) => STATUS_LABELS[s] ?? s;

  loading = signal(true);
  orders = signal<Order[]>([]);

  // Rango de fechas opcional — sin nada, trae todo el historial.
  fromDate = signal('');
  toDate = signal('');

  selectedOrder = signal<Order | null>(null);
  printingInvoice = signal<Invoice | null>(null);
  loadingInvoice = signal(false);
  errorMessage = signal<string | null>(null);

  constructor() {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.orderService.list(this.slug, 'history', this.fromDate() || undefined, this.toDate() || undefined).subscribe({
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

  modifierNamesLabel(item: Order['items'][number]): string {
    return item.modifiers.map((m) => m.modifierName).join(', ');
  }

  viewInvoice(order: Order): void {
    this.loadingInvoice.set(true);
    this.errorMessage.set(null);

    this.orderService.getInvoice(this.slug, order.id).subscribe({
      next: (invoice) => {
        this.loadingInvoice.set(false);
        this.printingInvoice.set(invoice);
      },
      error: (err) => {
        this.loadingInvoice.set(false);
        this.errorMessage.set(err?.error?.error || 'No se pudo cargar el recibo.');
      },
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