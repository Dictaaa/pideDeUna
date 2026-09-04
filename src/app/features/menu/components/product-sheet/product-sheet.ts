import { CurrencyPipe } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { ModifierGroup, ModifierOption, Product, ProductMedia, SelectedModifier } from '../../../../core/models/menu';
import { FoodBurstService } from '../../../../shared/services/food-burst';

@Component({
  selector: 'app-product-sheet',
  standalone: true,
  imports: [CurrencyPipe],
  templateUrl: './product-sheet.html',
  styleUrl: './product-sheet.scss',
})
export class ProductSheet {
  private foodBurst = inject(FoodBurstService);

  /** null = hoja cerrada */
  product = input<Product | null>(null);

  closed = output<void>();
  addedToCart = output<{ product: Product; modifiers: SelectedModifier[]; quantity: number }>();

  quantity = signal(1);
  /** groupId -> Set de optionId seleccionados */
  selection = signal<Record<string, Set<string>>>({});

  isOpen = computed(() => this.product() !== null);

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
        // Esto NO debería pasar con el API real (lo probamos: siempre
        // devuelve options: [] como mínimo). Si ves este mensaje, el
        // producto/grupo que se está abriendo no vino del backend real
        // o se construyó a mano en algún lado sin ese campo.
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
    // Cada vez que cambia el producto mostrado, reinicia cantidad y
    // preselecciona la primera opción de los grupos "radio" obligatorios.
    effect(() => {
      const p = this.product();
      this.quantity.set(1);
      this.activeMediaIndex.set(0);
      if (!p) {
        this.selection.set({});
        return;
      }
      const initial: Record<string, Set<string>> = {};
      for (const group of p.modifierGroups ?? []) {
        const firstOption = Array.isArray(group.options) ? group.options[0] : undefined;
        initial[group.id] =
          group.maxSelections === 1 && group.required && firstOption
            ? new Set([firstOption.id])
            : new Set();
      }
      this.selection.set(initial);
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

  /** Deslizar con el dedo en el celular — el umbral evita que un toque normal se confunda con swipe. */
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
    this.addedToCart.emit({ product: p, modifiers, quantity: this.quantity() });
  }
}