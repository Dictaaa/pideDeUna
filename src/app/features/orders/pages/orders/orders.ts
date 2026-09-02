import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { OrderAdmin } from '../../services/order-admin';
import { TableAdmin } from '../../../tables/services/table-admin';
import { Menu } from '../../../menu/services/menu';
import { Order, OrderItemLine } from '../../../../core/models/order.models';
import { AdminTable } from '../../../tables/models/table.models';
import { MenuCategory, Product } from '../../../../core/models/menu';
import { TableSkeleton } from '../../../../shared/components/table-skeleton/table-skeleton';
import { FoodBurstService } from '../../../../shared/services/food-burst';

interface DraftItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  PREPARING: 'En cocina',
  READY: 'Listo',
  SERVED: 'Entregado',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
};

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [FormsModule, DecimalPipe, TableSkeleton],
  templateUrl: './orders.html',
  styleUrl: './orders.scss',
})
export class Orders {
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderAdmin);
  private tableService = inject(TableAdmin);
  private menuService = inject(Menu);
  private foodBurst = inject(FoodBurstService);

  slug = this.route.parent!.snapshot.paramMap.get('slug')!;
  statusLabel = (s: string) => STATUS_LABELS[s] ?? s;

  loading = signal(true);
  orders = signal<Order[]>([]);
  tables = signal<AdminTable[]>([]);
  categories = signal<MenuCategory[]>([]);

  panelOpen = signal(false);
  panelMode = signal<'create' | 'edit'>('create');
  activeOrder = signal<Order | null>(null);

  // Solo se usan en modo "crear" — el pedido todavía no existe en el backend.
  selectedTableId = signal('');
  customerName = signal('');
  draftItems = signal<DraftItem[]>([]);

  pickerCategoryId = signal<string | null>(null);
  saving = signal(false);
  errorMessage = signal<string | null>(null);

  draftTotal = computed(() => this.draftItems().reduce((sum, i) => sum + i.unitPrice * i.quantity, 0));

  constructor() {
    this.reload();
    this.tableService.list(this.slug).subscribe({ next: (tables) => this.tables.set(tables) });
    this.menuService.getBySlug(this.slug).subscribe({
      next: (res) => {
        this.categories.set(res.categories);
        this.pickerCategoryId.set(res.categories[0]?.id ?? null);
      },
    });
  }

  reload(): void {
    this.loading.set(true);
    this.orderService.list(this.slug, 'active').subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.loading.set(false);
        // Si el pedido que se está viendo en el panel cambió (p. ej. cocina
        // lo avanzó), refresca lo que se ve ahí también.
        const current = this.activeOrder();
        if (current) {
          const fresh = orders.find((o) => o.id === current.id);
          if (fresh) this.activeOrder.set(fresh);
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

  productsInPickerCategory(): Product[] {
    return this.categories().find((c) => c.id === this.pickerCategoryId())?.products ?? [];
  }

  // ---------------- Crear pedido ----------------

  openCreate(): void {
    this.panelMode.set('create');
    this.activeOrder.set(null);
    this.selectedTableId.set(this.tables()[0]?.id ?? '');
    this.customerName.set('');
    this.draftItems.set([]);
    this.errorMessage.set(null);
    this.panelOpen.set(true);
  }

  addDraftProduct(product: Product): void {
    const current = this.draftItems();
    const existing = current.find((i) => i.productId === product.id);
    if (existing) {
      this.draftItems.set(
        current.map((i) => (i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i))
      );
    } else {
      this.draftItems.set([
        ...current,
        { productId: product.id, name: product.name, unitPrice: Number(product.price), quantity: 1 },
      ]);
    }
  }

  decrementDraft(item: DraftItem): void {
    const current = this.draftItems();
    if (item.quantity <= 1) {
      this.draftItems.set(current.filter((i) => i.productId !== item.productId));
    } else {
      this.draftItems.set(
        current.map((i) => (i.productId === item.productId ? { ...i, quantity: i.quantity - 1 } : i))
      );
    }
  }

  submitCreate(event: Event): void {
    if (!this.selectedTableId()) {
      this.errorMessage.set('Elige una mesa — no puede faltar.');
      return;
    }
    if (this.draftItems().length === 0) {
      this.errorMessage.set('Agrega al menos un producto.');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);

    this.orderService
      .create(this.slug, {
        tableId: this.selectedTableId(),
        customerName: this.customerName().trim() || undefined,
        items: this.draftItems().map((i) => ({ productId: i.productId, quantity: i.quantity })),
      })
      .subscribe({
        next: () => {
           this.foodBurst.trigger(event.currentTarget as HTMLElement);
          this.saving.set(false);
          this.panelOpen.set(false);
          this.reload();
        },
        error: (err) => {
          this.saving.set(false);
          this.errorMessage.set(err?.error?.error || 'No se pudo crear el pedido.');
        },
      });
  }

  // ---------------- Ver / editar pedido existente ----------------

  openOrder(order: Order): void {
    this.panelMode.set('edit');
    this.activeOrder.set(order);
    this.pickerCategoryId.set(this.categories()[0]?.id ?? null);
    this.errorMessage.set(null);
    this.panelOpen.set(true);
  }

  addProductToActiveOrder(product: Product): void {
    const order = this.activeOrder();
    if (!order) return;

    this.orderService.addItem(this.slug, order.id, { productId: product.id, quantity: 1 }).subscribe({
      next: (fresh) => {
        this.activeOrder.set(fresh);
        this.reload();
      },
      error: (err) => this.errorMessage.set(err?.error?.error || 'No se pudo agregar el producto.'),
    });
  }

  removeOrderItem(item: OrderItemLine): void {
    const order = this.activeOrder();
    if (!order) return;

    this.orderService.removeItem(this.slug, order.id, item.id).subscribe({
      next: (fresh) => {
        this.activeOrder.set(fresh);
        this.reload();
      },
      error: (err) => this.errorMessage.set(err?.error?.error || 'No se pudo quitar el producto.'),
    });
  }

  cancelOrder(order: Order): void {
    if (!confirm(`¿Cancelar el pedido #${order.orderNumber}?`)) return;
    this.orderService.cancel(this.slug, order.id).subscribe({
      next: () => {
        this.panelOpen.set(false);
        this.reload();
      },
    });
  }

  serveOrder(order: Order): void {
    this.orderService.serve(this.slug, order.id).subscribe({
      next: () => {
        this.panelOpen.set(false);
        this.reload();
      },
      error: (err) => this.errorMessage.set(err?.error?.error || 'No se pudo marcar como entregado.'),
    });
  }

  closePanel(): void {
    this.panelOpen.set(false);
  }
}