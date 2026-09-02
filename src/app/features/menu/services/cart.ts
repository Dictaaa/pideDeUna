import { Injectable, computed, signal } from '@angular/core';
import { CartLine, Product, SelectedModifier } from '../../../core/models/menu';

@Injectable({ providedIn: 'root' })
export class Cart {
  private readonly _lines = signal<CartLine[]>([]);

  /** Solo lectura hacia afuera — todo cambio pasa por los métodos de este servicio. */
  readonly lines = this._lines.asReadonly();

  readonly count = computed(() =>
    this._lines().reduce((sum, l) => sum + l.quantity, 0)
  );

  readonly total = computed(() =>
    this._lines().reduce((sum, l) => sum + l.unitPrice * l.quantity, 0)
  );

  readonly isEmpty = computed(() => this._lines().length === 0);

  add(product: Product, modifiers: SelectedModifier[], quantity: number): void {
    const unitExtra = modifiers.reduce((sum, m) => sum + m.price, 0);
    const line: CartLine = {
      lineId: crypto.randomUUID(),
      productId: product.id,
      name: product.name,
      imageUrl: product.imageUrl ?? product.media?.[0]?.url ?? null,
      unitPrice: Number(product.price) + unitExtra,
      quantity,
      modifiers,
    };
    this._lines.update((lines) => [...lines, line]);
  }

  removeLine(lineId: string): void {
    this._lines.update((lines) => lines.filter((l) => l.lineId !== lineId));
  }

  clear(): void {
    this._lines.set([]);
  }
}
