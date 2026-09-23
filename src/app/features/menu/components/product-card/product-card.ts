import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';
import { EffectiveProduct } from '../../../../core/models/menu.model';
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

  product = input.required<EffectiveProduct>();
  open = output<EffectiveProduct>();
  quickAdd = output<EffectiveProduct>();

  /**
   * Prioriza las fotos del módulo de media, ordenadas: la marcada
   * isPrimary primero, si no la de menor sortOrder — el orden del
   * arreglo tal como llega del backend no es de fiar. imageUrl es solo
   * el campo legado para productos que nunca subieron nada por acá;
   * se usa `||` y no `??` en ese último fallback porque un imageUrl en
   * blanco ("") no debe "ganarle" a fotos que sí existen.
   */
  thumbUrl = computed(() => {
    const p = this.product();
    const media = p.media ?? [];
    if (media.length === 0) return p.imageUrl || null;
    const primary = media.find((m) => m.isPrimary) ?? [...media].sort((a, b) => a.sortOrder - b.sortOrder)[0];
    return primary.url || p.imageUrl || null;
  });

  hasModifiers = computed(() => (this.product().modifierGroups?.length ?? 0) > 0);

  hasDiscount = computed(() => {
    const p = this.product();
    return p.compareAtPrice !== null && Number(p.compareAtPrice) > Number(p.effectivePrice);
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