import { CurrencyPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { CartLine } from '../../../../core/models/menu.models';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CurrencyPipe],
  templateUrl: './cart-drawer.html',
  styleUrl: './cart-drawer.scss',
})
export class CartDrawer {
  isOpen = input.required<boolean>();
  lines = input.required<CartLine[]>();
  total = input.required<number>();

  closed = output<void>();
  removeLine = output<string>();
  sendOrder = output<void>();

  modifierNames(line: CartLine): string {
    return line.modifiers.map((m) => m.name).join(', ');
  }
  
}