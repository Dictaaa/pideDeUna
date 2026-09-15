import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { ModifierGroup, ModifierOption, Product, ProductMedia, Promotion, SelectedModifier } from '../../../../core/models/menu';
import { FoodBurstService } from '../../../../shared/services/food-burst';

export interface AddedComboPayload {
  promotion: Promotion;
  selections: { productId: string; productName: string; quantity: number }[];
  notes: string;
}

@Component({
  selector: 'app-product-sheet',
  standalone: true,
  imports: [CurrencyPipe, FormsModule],
  templateUrl: './product-sheet.html',
  styleUrl: './product-sheet.scss',
})
export class ProductSheet {
  private foodBurst = inject(FoodBurstService);

  /** null = no se está mostrando un producto normal */
  product = input<Product | null>(null);
  /** null = no se está mostrando un combo — product y combo son excluyentes, el que esté abierto es el que no es null */
  combo = input<Promotion | null>(null);

  closed = output<void>();
  addedToCart = output<{ product: Product; modifiers: SelectedModifier[]; quantity: number; notes: string }>();
  addedCombo = output<AddedComboPayload>();

  quantity = signal(1);
  notes = signal('');
  /** groupId -> Set de optionId seleccionados (para un producto normal) */
  selection = signal<Record<string, Set<string>>>({});

  /** productId -> cantidad elegida (para armar un combo) */
  comboSelections = signal<Record<string, number>>({});
  comboNotes = signal('');
  comboTotalSelected = computed(() => Object.values(this.comboSelections()).reduce((a, b) => a + b, 0));

  isOpen = computed(() => this.product() !== null || this.combo() !== null);

  /** Foto principal primero, luego el resto en su orden — así el carrusel abre en la misma foto que ya se ve en la tarjeta. */
  sortedMedia = computed<ProductMedia[]>(() => {
    const p = this.product();
    if (!p?.media?.length) return [];
    return [...p.media].sort((a, b) => {
      if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
      return a.sortOrder - b.sortOrder;
    });
  });

  activeMediaIndex = signal(0);
  currentMedia = computed<ProductMedia | null>(() => this.sortedMedia()[this.activeMediaIndex()] ?? null);
  hasCarousel = computed(() => this.sortedMedia().length > 1);

  /** Productos viejos que solo tienen imageUrl y nunca subieron fotos por el módulo de media. */
  fallbackImageUrl = computed(() => this.product()?.imageUrl ?? null);

  private touchStartX = 0;

  unitTotal = computed(() => {
    const p = this.product();
    if (!p) return 0;
    let total = Number(p.price);
    const sel = this.selection();
    for (const group of p.modifierGroups ?? []) {
      const chosen = sel[group.id] ?? new Set<string>();
      if (!Array.isArray(group.options)) {
        console.warn(
          `[ProductSheet] El grupo "${group.name}" del producto "${p.name}" llegó sin "options". Revisa el origen de estos datos.`,
          group
        );
        continue;
      }
      for (const opt of group.options) {
        if (chosen.has(opt.id)) total += Number(opt.price);
      }
    }
    return total;
  });

  grandTotal = computed(() => this.unitTotal() * this.quantity());

  constructor() {
    // Un solo efecto para los dos casos — cada vez que se abre un
    // producto O un combo, se reinicia todo el estado (cantidad,
    // observaciones, selección) para que no quede nada de lo anterior.
    effect(() => {
      const p = this.product();
      const c = this.combo();

      this.quantity.set(1);
      this.notes.set('');
      this.comboNotes.set('');
      this.activeMediaIndex.set(0);

      if (p) {
        const initial: Record<string, Set<string>> = {};
        for (const group of p.modifierGroups ?? []) {
          const firstOption = Array.isArray(group.options) ? group.options[0] : undefined;
          initial[group.id] =
            group.maxSelections === 1 && group.required && firstOption
              ? new Set([firstOption.id])
              : new Set();
        }
        this.selection.set(initial);
      } else {
        this.selection.set({});
      }

      if (c) {
        const initial: Record<string, number> = {};
        if (c.products.length === 1) {
          // Un solo producto: no hay nada que elegir, se preselecciona
          // completo — el selector igual se muestra, solo para poder
          // agregar una observación antes de confirmar.
          initial[c.products[0].id] = c.buyQuantity ?? 0;
        } else {
          for (const cp of c.products) initial[cp.id] = 0;
        }
        this.comboSelections.set(initial);
      } else {
        this.comboSelections.set({});
      }
    });
  }

  isSelected(groupId: string, optionId: string): boolean {
    return this.selection()[groupId]?.has(optionId) ?? false;
  }

  toggleOption(group: ModifierGroup, option: ModifierOption): void {
    this.selection.update((state) => {
      const next: Record<string, Set<string>> = { ...state };
      const current = new Set(next[group.id] ?? []);
      if (group.maxSelections === 1) {
        current.clear();
        current.add(option.id);
      } else if (current.has(option.id)) {
        current.delete(option.id);
      } else if (current.size < group.maxSelections) {
        current.add(option.id);
      }
      next[group.id] = current;
      return next;
    });
  }

  incQty(): void {
    this.quantity.update((q) => q + 1);
  }
  decQty(): void {
    this.quantity.update((q) => Math.max(1, q - 1));
  }

  close(): void {
    this.closed.emit();
  }

  goToSlide(index: number): void {
    this.activeMediaIndex.set(index);
  }

  prevSlide(): void {
    const total = this.sortedMedia().length;
    if (total < 2) return;
    this.activeMediaIndex.update((i) => (i - 1 + total) % total);
  }

  nextSlide(): void {
    const total = this.sortedMedia().length;
    if (total < 2) return;
    this.activeMediaIndex.update((i) => (i + 1) % total);
  }

  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0].clientX;
  }

  onTouchEnd(event: TouchEvent): void {
    const deltaX = event.changedTouches[0].clientX - this.touchStartX;
    if (Math.abs(deltaX) < 40) return;
    if (deltaX < 0) this.nextSlide();
    else this.prevSlide();
  }

  confirmAdd(event: Event): void {
    const p = this.product();
    if (!p) return;
    const sel = this.selection();
    const modifiers: SelectedModifier[] = [];
    for (const group of p.modifierGroups ?? []) {
      const chosen = sel[group.id] ?? new Set<string>();
      for (const opt of group.options ?? []) {
        if (chosen.has(opt.id)) {
          modifiers.push({ modifierId: opt.id, name: opt.name, price: Number(opt.price) });
        }
      }
    }
    this.foodBurst.trigger(event.currentTarget as HTMLElement);
    this.addedToCart.emit({ product: p, modifiers, quantity: this.quantity(), notes: this.notes().trim() });
  }

  // ---------------- Combo ----------------

  comboQuantityFor(productId: string): number {
    return this.comboSelections()[productId] ?? 0;
  }

  incrementComboQty(productId: string): void {
    const c = this.combo();
    if (!c || this.comboTotalSelected() >= (c.buyQuantity ?? 0)) return;
    this.comboSelections.update((s) => ({ ...s, [productId]: (s[productId] ?? 0) + 1 }));
  }

  decrementComboQty(productId: string): void {
    this.comboSelections.update((s) => {
      const current = s[productId] ?? 0;
      if (current <= 0) return s;
      return { ...s, [productId]: current - 1 };
    });
  }

  confirmCombo(event: Event): void {
    const c = this.combo();
    if (!c || this.comboTotalSelected() !== c.buyQuantity) return;

    const productMap = new Map(c.products.map((p) => [p.id, p]));
    const selections = Object.entries(this.comboSelections())
      .filter(([, qty]) => qty > 0)
      .map(([productId, quantity]) => ({
        productId,
        productName: productMap.get(productId)?.name ?? '',
        quantity,
      }));

    this.foodBurst.trigger(event.currentTarget as HTMLElement);
    this.addedCombo.emit({ promotion: c, selections, notes: this.comboNotes().trim() });
  }
}