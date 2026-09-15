import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
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
import { ModifierGroupAdmin } from '../../../modifier-groups/services/modifier-group-admin';
import { AdminModifierGroup } from '../../../modifier-groups/models/modifier-group.models';
import { PromotionAdmin } from '../../../promotions/services/promotion-admin';
import { AdminPromotion } from '../../../promotions/models/promotion.models';
import { SettingsAdmin } from '../../../settings/services/settings-admin';
import { Auth } from '../../../../core/services/auth';
import { Invoice } from '../../../../core/models/order.models';

interface DraftItem {
  key: string; // identidad estable para el @for — dos líneas pueden ser el mismo producto con distinta personalización
  productId: string;
  name: string;
  unitPrice: number; // ya incluye el precio de los adicionales elegidos
  quantity: number;
  notes: string;
  modifierIds: string[];
  modifierNames: string[]; // solo para mostrar en el resumen, no se manda al backend
}

interface DraftCombo {
  key: string;
  promotionId: string;
  promotionName: string;
  selections: { productId: string; productName: string; quantity: number }[];
  totalPrice: number; // el precio del combo lo vuelve a calcular el servidor al crear — esto es solo para mostrarlo antes
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  PREPARING: 'En cocina',
  READY: 'Listo',
  SERVED: 'Entregado',
  COMPLETED: 'Cobrado',
  CANCELLED: 'Cancelado',
};

// Cómo puede haberse cobrado un pedido — cubre efectivo, datáfono
// aparte, pasarela en línea (si el restaurante la tiene), o "otro".
// No procesamos el cobro de verdad, solo lo registramos.
const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Efectivo' },
  { value: 'CARD', label: 'Tarjeta (datáfono aparte)' },
  { value: 'TRANSFER', label: 'Transferencia' },
  { value: 'WOMPI', label: 'Wompi' },
  { value: 'EPAYCO', label: 'ePayco' },
  { value: 'OTHER', label: 'Otro' },
];

const REFRESH_MS = 8000; // mismo intervalo que usa el tablero de cocina

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [FormsModule, DecimalPipe, TableSkeleton],
  templateUrl: './orders.html',
  styleUrl: './orders.scss',
})
export class Orders implements OnDestroy {
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderAdmin);
  private tableService = inject(TableAdmin);
  private menuService = inject(Menu);
  private modifierGroupService = inject(ModifierGroupAdmin);
  private promotionService = inject(PromotionAdmin);
  private settingsService = inject(SettingsAdmin);
  private auth = inject(Auth);
  private intervalId: ReturnType<typeof setInterval>;

  slug = this.route.parent!.snapshot.paramMap.get('slug')!;
  statusLabel = (s: string) => STATUS_LABELS[s] ?? s;
  paymentMethods = PAYMENT_METHODS;

  loading = signal(true);
  orders = signal<Order[]>([]);
  tables = signal<AdminTable[]>([]);
  categories = signal<MenuCategory[]>([]);

  // Todos los adicionales del restaurante — cualquiera puede aplicarse a
  // cualquier producto al armar el pedido (no dependen de una asignación
  // previa en el maestro de productos; esa es una decisión de cada pedido).
  allModifierGroups = signal<AdminModifierGroup[]>([]);
  promotions = signal<AdminPromotion[]>([]);
  pickerMode = signal<'products' | 'promotions'>('products');

  // Armar un combo — solo disponible editando un pedido que ya existe
  // (para crear el pedido en sí, sin combo, se usa el flujo normal).
  buildingCombo = signal<AdminPromotion | null>(null);
  comboSelections = signal<Record<string, number>>({});
  panelOpen = signal(false);
  panelMode = signal<'create' | 'edit'>('create');
  activeOrder = signal<Order | null>(null);

  // Solo se usan en modo "crear" — el pedido todavía no existe en el backend.
  selectedTableId = signal('');
  customerName = signal('');
  draftItems = signal<DraftItem[]>([]);
  draftCombos = signal<DraftCombo[]>([]);

  pickerCategoryId = signal<string | null>(null);
  saving = signal(false);
  errorMessage = signal<string | null>(null);

  // Personalizar un producto antes de agregarlo (observaciones + adicionales)
  // — aplica igual en modo crear que en modo editar, por eso vive aparte
  // de los dos flujos y no dentro de cada uno.
  customizingProduct = signal<Product | null>(null);
  customizeNotes = signal('');
  customizeSelectedIds = signal<Set<string>>(new Set());
  addingCustomized = signal(false);

  // Solo se usan al cobrar (order.status === 'READY').
  paymentMethod = signal('CASH');
  paymentReference = signal('');
  charging = signal(false);
  serving = signal(false);
  // Configuración de propina del restaurante — se consulta una vez,
  // la decide el admin en Configuración, no se inventa por pedido.
  tipsAllowed = signal(false);
  tipRate = signal(0);
  includeTip = signal(true);

  // El recibo, listo para imprimir, justo después de cobrar.
  printingInvoice = signal<Invoice | null>(null);
  loadingInvoice = signal(false);

  /** Un cajero que NO es también mesero/admin no puede crear pedidos ni agregarles productos — solo cobrar. */
  isCashierOnly = computed(() => this.auth.hasRole('CASHIER') && !this.auth.hasRole('WAITER', 'RESTAURANT_ADMIN', 'SUPER_ADMIN'));

  /** Entregar el plato (READY -> SERVED) es de mesera/admin. Cobrar (SERVED -> COMPLETED) es solo de caja/admin. */
  canServe = computed(() => this.auth.hasRole('WAITER', 'RESTAURANT_ADMIN', 'SUPER_ADMIN'));
  canCharge = computed(() => this.auth.hasRole('CASHIER', 'RESTAURANT_ADMIN', 'SUPER_ADMIN'));

  draftTotal = computed(
    () =>
      this.draftItems().reduce((sum, i) => sum + i.unitPrice * i.quantity, 0) +
      this.draftCombos().reduce((sum, c) => sum + c.totalPrice, 0)
  );

  customizeExtraPrice = computed(() => {
    const selected = this.customizeSelectedIds();
    let extra = 0;
    for (const group of this.allModifierGroups()) {
      for (const opt of group.options ?? []) {
        if (selected.has(opt.id)) extra += Number(opt.price);
      }
    }
    return extra;
  });

  customizeUnitTotal = computed(() => {
    const p = this.customizingProduct();
    return p ? Number(p.price) + this.customizeExtraPrice() : 0;
  });

  comboTotalSelected = computed(() => Object.values(this.comboSelections()).reduce((a, b) => a + b, 0));

  constructor() {
    this.reload();
    this.tableService.list(this.slug).subscribe({ next: (tables) => this.tables.set(tables) });
    this.menuService.getBySlug(this.slug).subscribe({
      next: (res) => {
        this.categories.set(res.categories);
        this.pickerCategoryId.set(res.categories[0]?.id ?? null);
      },
      error: (err) => {
        console.error('[Orders] No se pudo cargar el menú para el selector de productos:', err);
        this.errorMessage.set('No se pudo cargar el menú. Revisa la consola del navegador.');
      },
    });
    this.modifierGroupService.list(this.slug).subscribe({
      next: (groups) => this.allModifierGroups.set(groups),
      error: (err) => console.error('[Orders] No se pudieron cargar los adicionales:', err),
    });
    this.promotionService.list(this.slug).subscribe({
      next: (promos) => this.promotions.set(promos.filter((p) => p.isActive)),
      error: (err) => console.error('[Orders] No se pudieron cargar las promociones:', err),
    });
    this.settingsService.getSettings(this.slug).subscribe({
      next: (settings) => {
        this.tipsAllowed.set(settings.allowTips);
        this.tipRate.set(Number(settings.tipRate));
      },
      error: (err) => console.error('[Orders] No se pudo cargar la configuración de propina:', err),
    });

    // Sin websockets todavía — se refresca sola para que la mesera/cajera
    // vean pedidos nuevos (incluidos los que mande el cliente por el QR
    // el día que exista esa pieza) sin tener que recargar la página a mano.
    this.intervalId = setInterval(() => this.reload(true), REFRESH_MS);
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }

  reload(silent = false): void {
    if (!silent) this.loading.set(true);
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
    this.draftCombos.set([]);
    this.errorMessage.set(null);
    this.customizingProduct.set(null);
    this.pickerMode.set('products');
    this.panelOpen.set(true);
  }

  decrementDraftAt(index: number): void {
    const current = this.draftItems();
    const item = current[index];
    if (!item) return;
    if (item.quantity <= 1) {
      this.draftItems.set(current.filter((_, i) => i !== index));
    } else {
      this.draftItems.set(current.map((it, i) => (i === index ? { ...it, quantity: it.quantity - 1 } : it)));
    }
  }

  incrementDraftAt(index: number): void {
    this.draftItems.set(this.draftItems().map((it, i) => (i === index ? { ...it, quantity: it.quantity + 1 } : it)));
  }

  submitCreate(): void {
    if (!this.selectedTableId()) {
      this.errorMessage.set('Elige una mesa — no puede faltar.');
      return;
    }
    if (this.draftItems().length === 0 && this.draftCombos().length === 0) {
      this.errorMessage.set('Agrega al menos un producto.');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);

    this.orderService
      .create(this.slug, {
        tableId: this.selectedTableId(),
        customerName: this.customerName().trim() || undefined,
        items: this.draftItems().map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          notes: i.notes || undefined,
          modifierIds: i.modifierIds.length ? i.modifierIds : undefined,
        })),
        combos: this.draftCombos().map((c) => ({
          promotionId: c.promotionId,
          selections: c.selections.map((s) => ({ productId: s.productId, quantity: s.quantity })),
        })),
      })
      .subscribe({
        next: () => {
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
    this.paymentMethod.set('CASH');
    this.paymentReference.set('');
    this.errorMessage.set(null);
    this.customizingProduct.set(null);
    this.pickerMode.set('products');
    this.panelOpen.set(true);
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

  /** La mesera marca que ya entregó el plato — no cobra nada, solo lo manda a caja. */
  confirmServe(order: Order): void {
    this.serving.set(true);
    this.errorMessage.set(null);

    this.orderService.serve(this.slug, order.id).subscribe({
      next: () => {
        this.serving.set(false);
        this.panelOpen.set(false);
        this.reload();
      },
      error: (err) => {
        this.serving.set(false);
        this.errorMessage.set(err?.error?.error || 'No se pudo marcar como entregado.');
      },
    });
  }

  /** La cajera cobra y cierra el pedido — pide método de pago (obligatorio) y referencia externa (opcional). */
  confirmCharge(order: Order): void {
    this.charging.set(true);
    this.errorMessage.set(null);

    this.orderService
      .charge(this.slug, order.id, {
        paymentMethod: this.paymentMethod(),
        transactionReference: this.paymentReference().trim() || undefined,
        includeTip: this.tipsAllowed() ? this.includeTip() : false,
      })
      .subscribe({
        next: (fresh) => {
          this.charging.set(false);
          this.reload();
          this.showInvoiceFor(fresh);
        },
        error: (err) => {
          this.charging.set(false);
          this.errorMessage.set(err?.error?.error || 'No se pudo registrar el cobro.');
        },
      });
  }

  /** Trae el recibo recién generado y lo deja listo para imprimir. */
  private showInvoiceFor(order: Order): void {
    this.loadingInvoice.set(true);
    this.orderService.getInvoice(this.slug, order.id).subscribe({
      next: (invoice) => {
        this.loadingInvoice.set(false);
        this.panelOpen.set(false);
        this.printingInvoice.set(invoice);
      },
      error: () => {
        this.loadingInvoice.set(false);
        this.panelOpen.set(false); // el cobro sí funcionó — solo no se pudo traer el recibo para mostrarlo
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

  closePanel(): void {
    this.panelOpen.set(false);
  }

  modifierNamesLabel(item: OrderItemLine): string {
    return item.modifiers.map((m) => m.modifierName).join(', ');
  }

  comboSelectionsLabel(combo: DraftCombo): string {
    return combo.selections.map((s) => `${s.quantity}× ${s.productName}`).join(', ');
  }

  // ---------------- Personalizar (observaciones + adicionales) ----------------

  openCustomize(product: Product): void {
    this.customizingProduct.set(product);
    this.customizeNotes.set('');
    this.customizeSelectedIds.set(new Set());
  }

  cancelCustomize(): void {
    this.customizingProduct.set(null);
  }

  isCustomizeSelected(optionId: string): boolean {
    return this.customizeSelectedIds().has(optionId);
  }

  toggleCustomizeOption(group: AdminModifierGroup, optionId: string): void {
    this.customizeSelectedIds.update((current) => {
      const next = new Set(current);
      if (group.maxSelections === 1) {
        for (const opt of group.options ?? []) next.delete(opt.id);
        next.add(optionId);
      } else if (next.has(optionId)) {
        next.delete(optionId);
      } else if (next.size < group.maxSelections) {
        next.add(optionId);
      }
      return next;
    });
  }

  confirmCustomize(): void {
    const product = this.customizingProduct();
    if (!product) return;

    const selectedIds = Array.from(this.customizeSelectedIds());
    const modifierNames: string[] = [];
    for (const group of this.allModifierGroups()) {
      for (const opt of group.options ?? []) {
        if (selectedIds.includes(opt.id)) modifierNames.push(opt.name);
      }
    }
    const notes = this.customizeNotes().trim();

    if (this.panelMode() === 'create') {
      this.draftItems.set([
        ...this.draftItems(),
        {
          key: crypto.randomUUID(),
          productId: product.id,
          name: product.name,
          unitPrice: this.customizeUnitTotal(),
          quantity: 1,
          notes,
          modifierIds: selectedIds,
          modifierNames,
        },
      ]);
      this.customizingProduct.set(null);
      return;
    }

    const order = this.activeOrder();
    if (!order) return;

    this.addingCustomized.set(true);
    this.orderService
      .addItem(this.slug, order.id, {
        productId: product.id,
        quantity: 1,
        notes: notes || undefined,
        modifierIds: selectedIds.length ? selectedIds : undefined,
      })
      .subscribe({
        next: (fresh) => {
          this.addingCustomized.set(false);
          this.activeOrder.set(fresh);
          this.customizingProduct.set(null);
          this.reload();
        },
        error: (err) => {
          this.addingCustomized.set(false);
          this.errorMessage.set(err?.error?.error || 'No se pudo agregar el producto.');
        },
      });
  }

  // ---------------- Combos (promociones) ----------------

  selectCategoryTab(categoryId: string): void {
    this.pickerMode.set('products');
    this.pickerCategoryId.set(categoryId);
  }

    openBuildCombo(promo: AdminPromotion): void {
    // Un solo producto en el combo: no hay nada que elegir — se agrega
    // directo con la cantidad completa, sin mostrar la pantalla de "+/–".
    if (promo.products.length === 1) {
      const only = promo.products[0];
      this.buildingCombo.set(promo);
      this.comboSelections.set({ [only.id]: promo.buyQuantity ?? 0 });
      this.confirmCombo();
      return;
    }

    this.buildingCombo.set(promo);
    const initial: Record<string, number> = {};
    for (const p of promo.products) initial[p.id] = 0;
    this.comboSelections.set(initial);
  }

  cancelBuildCombo(): void {
    this.buildingCombo.set(null);
  }

  comboQuantityFor(productId: string): number {
    return this.comboSelections()[productId] ?? 0;
  }

  incrementComboQty(productId: string): void {
    const promo = this.buildingCombo();
    if (!promo || this.comboTotalSelected() >= promo.buyQuantity!) return;
    this.comboSelections.update((s) => ({ ...s, [productId]: (s[productId] ?? 0) + 1 }));
  }

  decrementComboQty(productId: string): void {
    this.comboSelections.update((s) => {
      const current = s[productId] ?? 0;
      if (current <= 0) return s;
      return { ...s, [productId]: current - 1 };
    });
  }

  confirmCombo(): void {
    const promo = this.buildingCombo();
    if (!promo) return;
    if (this.comboTotalSelected() !== promo.buyQuantity) return;

    const selections = Object.entries(this.comboSelections())
      .filter(([, qty]) => qty > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));

    if (this.panelMode() === 'create') {
      const productMap = new Map(promo.products.map((p) => [p.id, p]));
      this.draftCombos.set([
        ...this.draftCombos(),
        {
          key: crypto.randomUUID(),
          promotionId: promo.id,
          promotionName: promo.name,
          selections: selections.map((s) => ({
            productId: s.productId,
            productName: productMap.get(s.productId)?.name ?? '',
            quantity: s.quantity,
          })),
          totalPrice: Number(promo.fixedAmount ?? 0),
        },
      ]);
      this.buildingCombo.set(null);
      return;
    }

    const order = this.activeOrder();
    if (!order) return;

    this.addingCustomized.set(true);
    this.orderService.addCombo(this.slug, order.id, promo.id, selections).subscribe({
      next: (fresh) => {
        this.addingCustomized.set(false);
        this.activeOrder.set(fresh);
        this.buildingCombo.set(null);
        this.reload();
      },
      error: (err) => {
        this.addingCustomized.set(false);
        this.errorMessage.set(err?.error?.error || 'No se pudo agregar el combo.');
      },
    });
  }

  removeDraftCombo(index: number): void {
    this.draftCombos.set(this.draftCombos().filter((_, i) => i !== index));
  }
}