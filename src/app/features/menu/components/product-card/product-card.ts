import { CurrencyPipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { Product } from '../../../../core/models/menu';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CurrencyPipe],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
})
export class ProductCard{
  product = input.required<Product>();
  open = output<Product>();
  quickAdd = output<Product>();

  thumbUrl = computed(
    () => this.product().imageUrl ?? this.product().media?.[0]?.url ?? null
  );

  hasModifiers = computed(() => this.product().modifierGroups.length > 0);

  onRowClick(): void {
    this.open.emit(this.product());
  }

  onAddClick(event: Event): void {
    event.stopPropagation();
    if (this.hasModifiers()) {
      this.open.emit(this.product());
    } else {
      this.quickAdd.emit(this.product());
    }
  }
}