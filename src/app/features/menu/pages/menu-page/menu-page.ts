import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Menu } from '../../services/menu';
import { Cart } from '../../services/cart';
import { PublicOrderService } from '../../services/public-order';
import { MenuCategory, Product, Promotion, Restaurant, SelectedModifier } from '../../../../core/models/menu';
import { SessionInfo } from '../../models/public-order.models';

import { CategoryNav } from '../../components/category-nav/category-nav';
import { ProductCard } from '../../components/product-card/product-card';
import { AddedComboPayload, ProductSheet } from '../../components/product-sheet/product-sheet';
import { CartBar } from '../../components/cart-bar/cart-bar';
import { CartDrawer } from '../../components/cart-drawer/cart-drawer';
import { Skeleton } from '../../../../shared/components/skeleton/skeleton';
import { applyMenuFont } from '../../../../shared/utils/menu-fonts';

@Component({
  selector: 'app-menu-page',
  standalone: true,
  imports: [CategoryNav, ProductCard, ProductSheet, CartBar, CartDrawer, Skeleton, DecimalPipe],
  templateUrl: './menu-page.html',
  styleUrl: './menu-page.scss',
})
export class MenuPage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private menuService = inject(Menu);
  private publicOrderService = inject(PublicOrderService);
  cart = inject(Cart);

  slug = this.route.snapshot.paramMap.get('slug')!;
  /** Token del QR IMPRESO de la mesa — nunca cambia. Lo que decide si se puede pedir es sessionInfo(). */
  mesaToken = this.route.snapshot.paramMap.get('token');

  loading = signal(true);
  loadError = signal<string | null>(null);
  restaurant = signal<Restaurant | null>(null);
  categories = signal<MenuCategory[]>([]);
  promotions = signal<Promotion[]>([]);

  activeCategoryId = signal<string | null>(null);
  cartDrawerOpen = signal(false);

  // La misma hoja (product-sheet) muestra un producto normal O un
  // combo — son excluyentes, nunca los dos a la vez.
  openProduct = signal<Product | null>(null);
  openCombo = signal<Promotion | null>(null);

  // Sesión de la mesa — si no hay token (link genérico del restaurante,
  // sin pasar por una mesa) o la mesera no la ha abierto, el cliente
  // solo puede VER el menú, nunca pedir.
  sessionInfo = signal<SessionInfo | null>(null);
  canOrder = computed(() => this.sessionInfo()?.canOrder ?? false);

  customerName = signal('');
  sendingOrder = signal(false);
  orderError = signal<string | null>(null);

  totalProducts = computed(() => this.categories().reduce((n, c) => n + c.products.length, 0));

  constructor() {
    this.menuService.getBySlug(this.slug).subscribe({
      next: (res) => {
        this.restaurant.set(res.restaurant);
        this.categories.set(res.categories);
        this.promotions.set(res.promotions);
        this.activeCategoryId.set(res.categories[0]?.id ?? null);
        this.loading.set(false);

        document.documentElement.style.setProperty('--primary', res.restaurant.primaryColor);
        document.documentElement.style.setProperty('--secondary', res.restaurant.secondaryColor);
        applyMenuFont(res.restaurant.fontFamily);

        // Solo se puede pedir si se entró por el QR de una mesa Y esa
        // mesa está abierta ahora mismo — un link genérico del
        // restaurante (sin token) siempre es "solo ver".
        if (this.mesaToken) {
          this.checkSession();
        }
      },
      error: () => {
        this.loadError.set('No pudimos cargar el menú de esta tienda. Intenta de nuevo.');
        this.loading.set(false);
      },
    });
  }

  private checkSession(): void {
    this.publicOrderService.getSessionInfo(this.slug, this.mesaToken!).subscribe({
      next: (info) => this.sessionInfo.set(info),
      error: () => this.sessionInfo.set({ canOrder: false }), // QR inválido: se queda en modo "solo ver"
    });
  }

  selectCategory(categoryId: string): void {
    this.activeCategoryId.set(categoryId);
    document.getElementById('cat-' + categoryId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  openProductSheet(product: Product): void {
    this.openCombo.set(null);
    this.openProduct.set(product);
  }

  openComboSheet(promo: Promotion): void {
    this.openProduct.set(null);
    this.openCombo.set(promo);
  }

  closeSheet(): void {
    this.openProduct.set(null);
    this.openCombo.set(null);
  }

  quickAdd(product: Product): void {
    this.cart.add(product, [], 1);
  }

  onAddedFromSheet(payload: { product: Product; modifiers: SelectedModifier[]; quantity: number; notes: string }): void {
    this.cart.add(payload.product, payload.modifiers, payload.quantity, payload.notes);
    this.openProduct.set(null);
  }

  onAddedCombo(payload: AddedComboPayload): void {
    this.cart.addCombo({
      promotionId: payload.promotion.id,
      promotionName: payload.promotion.name,
      selections: payload.selections,
      totalPrice: Number(payload.promotion.fixedAmount ?? 0),
      notes: payload.notes,
    });
    this.openCombo.set(null);
  }

  /**
   * El pedido de verdad — solo funciona si canOrder() es true (mesa
   * abierta por la mesera) y ya se escribió el nombre.
   */
  sendOrder(): void {
    if (this.cart.isEmpty() || !this.canOrder() || !this.mesaToken || this.sendingOrder()) return;
    if (!this.customerName().trim()) {
      this.orderError.set('Escribe tu nombre para confirmar el pedido.');
      return;
    }

    this.sendingOrder.set(true);
    this.orderError.set(null);

    const items = this.cart.lines().map((line) => ({
      productId: line.productId,
      quantity: line.quantity,
      notes: line.notes || undefined,
      modifierIds: line.modifiers.map((m) => m.modifierId),
    }));

    const combos = this.cart.combos().map((c) => ({
      promotionId: c.promotionId,
      selections: c.selections.map((s) => ({ productId: s.productId, quantity: s.quantity })),
      notes: c.notes || undefined,
    }));

    this.publicOrderService
      .createOrder(this.slug, this.mesaToken, { customerName: this.customerName().trim(), items, combos })
      .subscribe({
        next: (result) => {
          this.sendingOrder.set(false);
          this.cartDrawerOpen.set(false);
          this.cart.clear();
          this.router.navigate(['/', this.slug, 'pedido', result.orderId]);
        },
        error: (err) => {
          this.sendingOrder.set(false);
          this.orderError.set(err?.error?.error || 'No pudimos enviar tu pedido. Intenta de nuevo.');
        },
      });
  }
}