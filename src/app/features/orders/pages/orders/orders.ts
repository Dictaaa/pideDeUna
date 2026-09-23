import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable, map, of } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { OrderService } from '../../../../core/services/order.service';
import { TableService, TableSessionService } from '../../../../core/services/table.service';
import { MenuCategoryService, ModifierGroupService, ProductService } from '../../../../core/services/menu.service';
import { PromotionService } from '../../../../core/services/promotion.service';
import { SocketService } from '../../../../core/services/socket.service';
import { TokenStorageService } from '../../../../core/services/token-storage.service';

import { CreateComboInput, CreateOrderItemInput, Order, OrderItem } from '../../../../core/models/order.model';
import { EffectiveProduct, MenuCategory, ModifierGroup } from '../../../../core/models/menu.model';
import { EffectivePromotion } from '../../../../core/models/promotion.model';
import { RestaurantTable } from '../../../../core/models/table.model';
import { TableSkeleton } from '../../../../shared/components/table-skeleton/table-skeleton';

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

// Solo los estados que le tocan al SALÓN. En cuanto un pedido pasa a
// SERVED, desaparece de esta pantalla para todo el mundo — de ahí en
// adelante es de Caja (features/caja), no de Pedidos.
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  PREPARING: 'En cocina',
  READY: 'Listo',
};

const SOCKET_SAFETY_POLL_MS = 30000; // el socket hace el trabajo — esto es solo por si se cae

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [FormsModule, DecimalPipe, TableSkeleton],
  templateUrl: './orders.html',
  styleUrl: './orders.scss',
})
export class Orders implements OnDestroy {
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  private orderService = inject(OrderService);
  private tableService = inject(TableService);
  private tableSessionService = inject(TableSessionService);
  private categoryService = inject(MenuCategoryService);
  private productService = inject(ProductService);
  private modifierGroupService = inject(ModifierGroupService);
  private promotionService = inject(PromotionService);
  private socket = inject(SocketService);
  private tokenStorage = inject(TokenStorageService);
  private intervalId: ReturnType<typeof setInterval>;

  // Con paramsInheritanceStrategy: 'always', companySlug llega heredado
  // del padre sin tener que subir con route.parent.
  companySlug = this.route.snapshot.paramMap.get('companySlug')!;
  branchSlug = this.route.snapshot.paramMap.get('branchSlug')!;

  statusLabel = (s: string) => STATUS_LABELS[s] ?? s;

  loading = signal(true);
  orders = signal<Order[]>([]);
  tables = signal<RestaurantTable[]>([]);
  categories = signal<MenuCategory[]>([]);
  products = signal<EffectiveProduct[]>([]);

  // Todos los adicionales de la compañía — cualquiera puede aplicarse a
  // cualquier producto al armar el pedido (no dependen de una asignación
  // previa en el maestro de productos; esa es una decisión de cada pedido).
  allModifierGroups = signal<ModifierGroup[]>([]);
  promotions = signal<EffectivePromotion[]>([]);
  pickerMode = signal<'products' | 'promotions'>('products');

  // Armar un combo — disponible tanto creando como editando un pedido.
  buildingCombo = signal<EffectivePromotion | null>(null);
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
  customizingProduct = signal<EffectiveProduct | null>(null);
  customizeNotes = signal('');
  customizeSelectedIds = signal<Set<string>>(new Set());
  addingCustomized = signal(false);

  serving = signal(false);

  /** Entregar el plato (READY -> SERVED) es de mesera/admin — de ahí en adelante, el pedido es de Caja. */
  canServe = computed(() => this.auth.hasRole('WAITER', 'RESTAURANT_ADMIN', 'SUPER_ADMIN'));

  draftTotal = computed(
    () =>
      this.draftItems().reduce((sum, i) => sum + i.unitPrice * i.quantity, 0) +
      this.draftCombos().reduce((sum, c) => sum + c.totalPrice, 0)
  );

  customizeExtraPrice = computed(() => {
    const selected = this.customizeSelectedIds();
    let extra = 0;
    for (const group of this.allModifierGroups()) {
      for (const mod of group.modifiers ?? []) {
        if (selected.has(mod.id)) extra += Number(mod.price);
      }
    }
    return extra;
  });

  customizeUnitTotal = computed(() => {
    const p = this.customizingProduct();
    return p ? Number(p.effectivePrice) + this.customizeExtraPrice() : 0;
  });

  comboTotalSelected = computed(() => Object.values(this.comboSelections()).reduce((a, b) => a + b, 0));

  constructor() {
    this.reload();

    this.tableService.list(this.companySlug, this.branchSlug).subscribe({ next: (tables) => this.tables.set(tables) });

    this.categoryService.listForBranch(this.companySlug, this.branchSlug).subscribe({
      next: (cats) => {
        this.categories.set(cats);
        this.pickerCategoryId.set(cats[0]?.id ?? null);
      },
      error: (err) => {
        console.error('[Orders] No se pudo cargar el menú para el selector de productos:', err);
        this.errorMessage.set('No se pudo cargar el menú. Revisa la consola del navegador.');
      },
    });
    this.productService.listForBranch(this.companySlug, this.branchSlug).subscribe({
      next: (products) => this.products.set(products),
      error: (err) => console.error('[Orders] No se pudieron cargar los productos:', err),
    });
    this.modifierGroupService.list(this.companySlug).subscribe({
      next: (groups) => this.allModifierGroups.set(groups),
      error: (err) => console.error('[Orders] No se pudieron cargar los adicionales:', err),
    });
    this.promotionService.listForBranch(this.companySlug, this.branchSlug, true).subscribe({
      next: (promos) => this.promotions.set(promos),
      error: (err) => console.error('[Orders] No se pudieron cargar las promociones:', err),
    });

    // Socket para tiempo real: pedido nuevo, cocina avanzándolo, etc.
    // El poll de abajo queda solo como red de seguridad, mucho más
    // espaciado, por si el socket se cae.
    const token = this.tokenStorage.getToken();
    if (token) {
      this.socket.connectAsStaff(token);
      this.socket.on<{ orderId: string }>('order:created').subscribe(() => this.reload(true));
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
    // Solo los estados de SALÓN — en cuanto pasa a SERVED, ya no
    // aparece acá (pasó a ser de Caja).
    this.orderService.list(this.companySlug, this.branchSlug, ['PENDING', 'CONFIRMED', 'PREPARING', 'READY']).subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.loading.set(false);
        // Si el pedido que se está viendo en el panel cambió (p. ej.
        // cocina lo avanzó), refresca lo que se ve ahí también. Si ya
        // no está en la lista (pasó a SERVED), cierra el panel solo.
        const current = this.activeOrder();
        if (current) {
          const fresh = orders.find((o) => o.id === current.id);
          if (fresh) this.activeOrder.set(fresh);
          else this.panelOpen.set(false);
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

  productsInPickerCategory(): EffectiveProduct[] {
    const catId = this.pickerCategoryId();
    return this.products().filter((p) => p.categoryId === catId);
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

  /** Si la mesa ya tiene una sesión abierta, la reutiliza. Si no, la abre (el mesero está literalmente ahí armando el pedido). */
  private ensureTableSession(tableId: string): Observable<string> {
    const table = this.tables().find((t) => t.id === tableId);
    const openSession = table?.sessions?.find((s) => s.status === 'OPEN');
    if (openSession) return of(openSession.id);

    return this.tableService
      .openSession(this.companySlug, this.branchSlug, tableId)
      .pipe(map((session) => session.id));
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

    this.ensureTableSession(this.selectedTableId()).subscribe({
      next: (tableSessionId) => {
        this.orderService
          .createAsStaff(this.companySlug, this.branchSlug, {
            tableSessionId,
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
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err?.error?.error || 'No se pudo abrir la mesa.');
      },
    });
  }

  // ---------------- Ver / editar pedido existente ----------------

  openOrder(order: Order): void {
    this.panelMode.set('edit');
    this.activeOrder.set(order);
    this.pickerCategoryId.set(this.categories()[0]?.id ?? null);
    this.errorMessage.set(null);
    this.customizingProduct.set(null);
    this.pickerMode.set('products');
    this.panelOpen.set(true);
  }

  removeOrderItem(item: OrderItem): void {
    const order = this.activeOrder();
    if (!order) return;

    this.orderService.removeItem(this.companySlug, this.branchSlug, order.id, item.id).subscribe({
      next: (fresh) => {
        this.activeOrder.set(fresh);
        this.reload();
      },
      error: (err) => this.errorMessage.set(err?.error?.error || 'No se pudo quitar el producto.'),
    });
  }

  cancelOrder(order: Order): void {
    if (!confirm(`¿Cancelar el pedido #${order.orderNumber}?`)) return;
    this.orderService.cancel(this.companySlug, this.branchSlug, order.id).subscribe({
      next: () => {
        this.panelOpen.set(false);
        this.reload();
      },
    });
  }

  /** La mesera marca que ya entregó el plato — a partir de acá, el pedido pasa a Caja y desaparece de aquí. */
  confirmServe(order: Order): void {
    this.serving.set(true);
    this.errorMessage.set(null);

    this.orderService.serve(this.companySlug, this.branchSlug, order.id).subscribe({
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

  closePanel(): void {
    this.panelOpen.set(false);
  }

  modifierNamesLabel(item: OrderItem): string {
    return (item.modifiers ?? []).map((m) => m.modifierName).join(', ');
  }

  comboSelectionsLabel(combo: DraftCombo): string {
    return combo.selections.map((s) => `${s.quantity}× ${s.productName}`).join(', ');
  }

  // ---------------- Personalizar (observaciones + adicionales) ----------------

  openCustomize(product: EffectiveProduct): void {
    this.customizingProduct.set(product);
    this.customizeNotes.set('');
    this.customizeSelectedIds.set(new Set());
  }

  cancelCustomize(): void {
    this.customizingProduct.set(null);
  }

  isCustomizeSelected(modifierId: string): boolean {
    return this.customizeSelectedIds().has(modifierId);
  }

  toggleCustomizeOption(group: ModifierGroup, modifierId: string): void {
    this.customizeSelectedIds.update((current) => {
      const next = new Set(current);
      if (group.maxSelections === 1) {
        for (const mod of group.modifiers ?? []) next.delete(mod.id);
        next.add(modifierId);
      } else if (next.has(modifierId)) {
        next.delete(modifierId);
      } else if (next.size < group.maxSelections) {
        next.add(modifierId);
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
      for (const mod of group.modifiers ?? []) {
        if (selectedIds.includes(mod.id)) modifierNames.push(mod.name);
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

    const input: CreateOrderItemInput = {
      productId: product.id,
      quantity: 1,
      notes: notes || undefined,
      modifierIds: selectedIds.length ? selectedIds : undefined,
    };

    this.addingCustomized.set(true);
    this.orderService.addItem(this.companySlug, this.branchSlug, order.id, input).subscribe({
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

  openBuildCombo(promo: EffectivePromotion): void {
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
    if (!promo || this.comboTotalSelected() >= (promo.buyQuantity ?? 0)) return;
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
          totalPrice: Number(promo.effectiveFixedAmount ?? promo.fixedAmount ?? 0),
        },
      ]);
      this.buildingCombo.set(null);
      return;
    }

    const order = this.activeOrder();
    if (!order) return;

    const input: CreateComboInput = { promotionId: promo.id, selections };

    this.addingCustomized.set(true);
    this.orderService.addCombo(this.companySlug, this.branchSlug, order.id, input).subscribe({
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