import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';
import { Product } from '../../../../core/models/menu';
import { FoodBurstService } from '../../../../shared/services/food-burst';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CurrencyPipe],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
})
export class ProductCard {
  private foodBurst = inject(FoodBurstService);

  product = input.required<Product>();
  open = output<Product>();
  quickAdd = output<Product>();

  thumbUrl = computed(
    () => this.product().imageUrl ?? this.product().media?.[0]?.url ?? null
  );

  hasModifiers = computed(() => this.product().modifierGroups.length > 0);

  hasDiscount = computed(() => {
    const p = this.product();
    return p.compareAtPrice !== null && Number(p.compareAtPrice) > Number(p.price);
  });

  onRowClick(): void {
    this.open.emit(this.product());
  }

  onAddClick(event: Event): void {
    event.stopPropagation();
    if (this.hasModifiers()) {
      this.open.emit(this.product());
    } else {
      this.quickAdd.emit(this.product());
      const btn = event.currentTarget as HTMLElement;
      this.foodBurst.trigger(btn);
      btn.classList.remove('pop');
      void btn.offsetWidth; // fuerza reflow para poder re-disparar la animación en clics seguidos
      btn.classList.add('pop');
    }
  }
}