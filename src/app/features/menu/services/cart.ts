import { Injectable, computed, signal } from '@angular/core';
import { CartCombo, CartLine, Product, SelectedModifier } from '../../../core/models/menu';

@Injectable({ providedIn: 'root' })
export class Cart {
  private readonly _lines = signal<CartLine[]>([]);
  private readonly _combos = signal<CartCombo[]>([]);

  readonly lines = this._lines.asReadonly();
  readonly combos = this._combos.asReadonly();

  readonly count = computed(
    () =>
      this._lines().reduce((sum, l) => sum + l.quantity, 0) +
      this._combos().reduce((sum, c) => sum + c.selections.reduce((s, sel) => s + sel.quantity, 0), 0)
  );

  readonly total = computed(
    () =>
      this._lines().reduce((sum, l) => sum + l.unitPrice * l.quantity, 0) +
      this._combos().reduce((sum, c) => sum + c.totalPrice, 0)
  );

  readonly isEmpty = computed(() => this._lines().length === 0 && this._combos().length === 0);

  add(product: Product, modifiers: SelectedModifier[], quantity: number, notes = ''): void {
    const unitExtra = modifiers.reduce((sum, m) => sum + m.price, 0);
    const line: CartLine = {
      lineId: crypto.randomUUID(),
      productId: product.id,
      name: product.name,
      imageUrl: product.imageUrl ?? product.media?.[0]?.url ?? null,
      unitPrice: Number(product.price) + unitExtra,
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