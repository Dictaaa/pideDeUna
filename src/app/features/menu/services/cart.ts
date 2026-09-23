import { Injectable, computed, signal } from '@angular/core';
import { EffectiveProduct } from '../../../core/models/menu.model';

// Tipos de carrito — solo existen en el frontend, no tienen equivalente
// en la API. Por eso viven ACÁ y no en core/models/menu.model.
export interface SelectedModifier {
  modifierId: string;
  name: string;
  price: number;
}

export interface CartLine {
  lineId: string;
  productId: string;
  name: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  notes: string;
  modifiers: SelectedModifier[];
}

export interface CartComboSelection {
  productId: string;
  productName: string;
  quantity: number;
}

export interface CartCombo {
  comboId: string;
  promotionId: string;
  promotionName: string;
  selections: CartComboSelection[];
  totalPrice: number;
  notes: string;
}

@Injectable({ providedIn: 'root' })
export class Cart {
  private readonly _lines = signal<CartLine[]>([]);
  private readonly _combos = signal<CartCombo[]>([]);

  readonly lines = this._lines.asReadonly();
  readonly combos = this._combos.asReadonly();

  readonly count = computed(
    () =>
      this._lines().reduce((sum: number, l: CartLine) => sum + l.quantity, 0) +
      this._combos().reduce(
        (sum: number, c: CartCombo) => sum + c.selections.reduce((s: number, sel: CartComboSelection) => s + sel.quantity, 0),
        0
      )
  );

  readonly total = computed(
    () =>
      this._lines().reduce((sum: number, l: CartLine) => sum + l.unitPrice * l.quantity, 0) +
      this._combos().reduce((sum: number, c: CartCombo) => sum + c.totalPrice, 0)
  );

  readonly isEmpty = computed(() => this._lines().length === 0 && this._combos().length === 0);

  /**
   * unitPrice sale de effectivePrice, NUNCA de price base — un
   * producto puede costar distinto en esta sucursal (override), y el
   * carrito tiene que cobrar lo que el cliente está viendo en el
   * menú, no el precio de catálogo de la compañía.
   */
  add(product: EffectiveProduct, modifiers: SelectedModifier[], quantity: number, notes = ''): void {
    const unitExtra = modifiers.reduce((sum: number, m: SelectedModifier) => sum + m.price, 0);
    const line: CartLine = {
      lineId: crypto.randomUUID(),
      productId: product.id,
      name: product.name,
      imageUrl: product.imageUrl ?? product.media?.[0]?.url ?? null,
      unitPrice: Number(product.effectivePrice) + unitExtra,
      quantity,
      notes: notes.trim(),
      modifiers,
    };
    this._lines.update((lines) => [...lines, line]);
  }

  addCombo(combo: Omit<CartCombo, 'comboId'>): void {
    this._combos.update((combos) => [...combos, { ...combo, comboId: crypto.randomUUID() }]);
  }

  removeLine(lineId: string): void {
    this._lines.update((lines) => lines.filter((l) => l.lineId !== lineId));
  }

  removeCombo(comboId: string): void {
    this._combos.update((combos) => combos.filter((c) => c.comboId !== comboId));
  }

  clear(): void {
    this._lines.set([]);
    this._combos.set([]);
  }
}