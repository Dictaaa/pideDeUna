import { CurrencyPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-cart-bar',
  standalone: true,
  imports: [CurrencyPipe],
  templateUrl: './cart-bar.html',
  styleUrl: './cart-bar.scss',
})
export class CartBar {
  count = input.required<number>();
  total = input.required<number>();
  opened = output<void>();
}