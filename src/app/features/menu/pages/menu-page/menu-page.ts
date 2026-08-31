import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { ApiService } from '../../../../core/services/api';
import { CartService } from '../../services/cart';
import { MenuCategory, Product, Restaurant, SelectedModifier } from '../../../../core/models/menu.models';

import { CategoryNav } from '../../components/category-nav/category-nav';
import { ProductCard } from '../../components/product-card/product-card';
import { ProductSheet } from '../../components/product-sheet/product-sheet';
import { CartBar } from '../../components/cart-bar/cart-bar';
import { CartDrawer } from '../../components/cart-drawer/cart-drawer';

@Component({
  selector: 'app-menu-page',
  standalone: true,
  imports: [
    CategoryNav,
    ProductCard,
    ProductSheet,
    CartBar,
    CartDrawer,
  ],
  templateUrl: './menu-page.html',
  styleUrl: './menu-page.scss',
})
export class MenuPage {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  cart = inject(CartService);

  slug = this.route.snapshot.paramMap.get('slug')!;
  /** Token del QR de la mesa, si se entró por pidedeuna.com/:slug/mesa/:token */
  mesaToken = this.route.snapshot.paramMap.get('token');

  loading = signal(true);
  loadError = signal<string | null>(null);
  restaurant = signal<Restaurant | null>(null);
  categories = signal<MenuCategory[]>([]);

  activeCategoryId = signal<string | null>(null);
  openProduct = signal<Product | null>(null);
  cartDrawerOpen = signal(false);
  orderSentMessage = signal<string | null>(null);

  totalProducts = computed(() => this.categories().reduce((n, c) => n + c.products.length, 0));

  constructor() {
    this.api.getMenuBySlug(this.slug).subscribe({
      next: (res) => {
        this.restaurant.set(res.restaurant);
        this.categories.set(res.categories);
        this.activeCategoryId.set(res.categories[0]?.id ?? null);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('No pudimos cargar el menú de esta tienda. Intenta de nuevo.');
        this.loading.set(false);
      },
    });
  }

  selectCategory(categoryId: string): void {
    this.activeCategoryId.set(categoryId);
    document.getElementById('cat-' + categoryId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  openProductSheet(product: Product): void {
    this.openProduct.set(product);
  }

  closeProductSheet(): void {
    this.openProduct.set(null);
  }

  quickAdd(product: Product): void {
    this.cart.add(product, [], 1);
  }

  onAddedFromSheet(payload: { product: Product; modifiers: SelectedModifier[]; quantity: number }): void {
    this.cart.add(payload.product, payload.modifiers, payload.quantity);
    this.openProduct.set(null);
  }

  sendOrder(): void {
    if (this.cart.isEmpty()) return;
    // TODO: reemplazar por POST /api/restaurantes/:slug/orders cuando
    // exista el bloque de modelos de pedidos en el backend.
    this.cartDrawerOpen.set(false);
    this.orderSentMessage.set('Pedido enviado a cocina');
    this.cart.clear();
    setTimeout(() => this.orderSentMessage.set(null), 2200);
  }
}