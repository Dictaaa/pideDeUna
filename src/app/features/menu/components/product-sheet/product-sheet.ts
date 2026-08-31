import { CurrencyPipe } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { ModifierGroup, ModifierOption, Product, SelectedModifier } from '../../../../core/models/menu.models';
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

  thumbUrl = computed(() => {
    const p = this.product();
    return p?.imageUrl ?? p?.media?.[0]?.url ?? null;
  });

  unitTotal = computed(() => {
    const p = this.product();
    if (!p) return 0;
    let total = Number(p.price);
    const sel = this.selection();
    for (const group of p.modifierGroups) {
      const chosen = sel[group.id] ?? new Set<string>();
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
      if (!p) {
        this.selection.set({});
        return;
      }
      const initial: Record<string, Set<string>> = {};
      for (const group of p.modifierGroups) {
        initial[group.id] =
          group.maxSelections === 1 && group.required && group.options[0]
            ? new Set([group.options[0].id])
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

  confirmAdd(event: Event): void {
    const p = this.product();
    if (!p) return;
    const sel = this.selection();
    const modifiers: SelectedModifier[] = [];
    for (const group of p.modifierGroups) {
      const chosen = sel[group.id] ?? new Set<string>();
      for (const opt of group.options) {
        if (chosen.has(opt.id)) {
          modifiers.push({ modifierId: opt.id, name: opt.name, price: Number(opt.price) });
        }
      }
    }
    this.foodBurst.trigger(event.currentTarget as HTMLElement);
    this.addedToCart.emit({ product: p, modifiers, quantity: this.quantity() });
  }
}