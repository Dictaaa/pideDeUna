import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, input, output } from '@angular/core';
import { CartCombo, CartLine } from '../../services/cart';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CurrencyPipe, FormsModule],
  templateUrl: './cart-drawer.html',
  styleUrl: './cart-drawer.scss',
})
export class CartDrawer {
  isOpen = input.required<boolean>();
  lines = input.required<CartLine[]>();
  combos = input<CartCombo[]>([]);
  total = input.required<number>();
  /** false = el cliente todavía no puede confirmar el pedido (nadie le ha abierto la mesa) — solo puede ver lo que lleva. */
  canOrder = input<boolean>(true);
  customerName = input<string>('');
  sending = input<boolean>(false);

  closed = output<void>();
  removeLine = output<string>();
  removeCombo = output<string>();
  sendOrder = output<void>();
  customerNameChange = output<string>();

  modifierNames(line: CartLine): string {
    return line.modifiers.map((m) => m.name).join(', ');
  }

  comboSelectionsLabel(combo: CartCombo): string {
    return combo.selections.map((s) => `${s.quantity}× ${s.productName}`).join(', ');
  }
}