import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { CustomerOrderService } from '../../../../core/services/customer-order.service';
import { CompanyService } from '../../../../core/services/company.service';
import { Cart } from '../../services/cart';
import { MenuCategory, EffectiveProduct } from '../../../../core/models/menu.model';
import { EffectivePromotion } from '../../../../core/models/promotion.model';
import { PublicCompanyInfo } from '../../../../core/models/company.model';
import { SelectedModifier } from '../../services/cart';

import { CategoryNav } from '../../components/category-nav/category-nav';
import { ProductCard } from '../../components/product-card/product-card';
import { AddedComboPayload, ProductSheet } from '../../components/product-sheet/product-sheet';
import { CartBar } from '../../components/cart-bar/cart-bar';
import { CartDrawer } from '../../components/cart-drawer/cart-drawer';
import { Skeleton } from '../../../../shared/components/skeleton/skeleton';
import { applyMenuFont } from '../../../../shared/utils/menu-fonts';
import { saveSessionToken } from '../../utils/session-token-storage';

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
  private customerOrderService = inject(CustomerOrderService);
  private companyService = inject(CompanyService);
  cart = inject(Cart);

  companySlug = this.route.snapshot.paramMap.get('companySlug')!;
  branchSlug = this.route.snapshot.paramMap.get('branchSlug')!;
  /** Token del QR IMPRESO de la mesa — nunca cambia. Lo que decide si se puede pedir es sessionToken(). */
  mesaToken = this.route.snapshot.paramMap.get('token');

  loading = signal(true);
  loadError = signal<string | null>(null);

  // La marca (logo/colores/tipografía) es de la COMPAÑÍA — todas sus
  // sucursales la comparten. El nombre/dirección de ESTA sucursal sale
  // de company.restaurants (endpoint público, no hay uno separado
  // "GET branch" sin login).
  company = signal<PublicCompanyInfo | null>(null);
  branch = computed(() => this.company()?.restaurants.find((r) => r.slug === this.branchSlug) ?? null);

  categories = signal<MenuCategory[]>([]);
  products = signal<EffectiveProduct[]>([]);
  promotions = signal<EffectivePromotion[]>([]);

  productsByCategory = computed(() => {
    const map = new Map<string, EffectiveProduct[]>();
    for (const p of this.products()) {
      if (!p.categoryId) continue;
      const list = map.get(p.categoryId) ?? [];
      list.push(p);
      map.set(p.categoryId, list);
    }
    return map;
  });

  activeCategoryId = signal<string | null>(null);
  cartDrawerOpen = signal(false);

  // La misma hoja (product-sheet) muestra un producto normal O un
  // combo — son excluyentes, nunca los dos a la vez.
  openProduct = signal<EffectiveProduct | null>(null);
  openCombo = signal<EffectivePromotion | null>(null);

  // Token de SESIÓN (no el mesaToken fijo) — solo existe si la mesera
  // ya abrió la mesa. Sin esto no se puede armar el pedido, sin
  // importar si el QR en sí era válido.
  sessionToken = signal<string | null>(null);
  canOrder = computed(() => !!this.sessionToken());

  customerName = signal('');
  sendingOrder = signal(false);
  orderError = signal<string | null>(null);

  totalProducts = computed(() => this.products().length);

  constructor() {
    this.companyService.getPublicInfo(this.companySlug).subscribe({
      next: (c) => {
        this.company.set(c);
        document.documentElement.style.setProperty('--primary', c.primaryColor);
        document.documentElement.style.setProperty('--secondary', c.secondaryColor);
        applyMenuFont(c.fontFamily);
      },
      error: () => {
        this.loadError.set('No pudimos cargar el menú de esta tienda. Intenta de nuevo.');
        this.loading.set(false);
      },
    });

    this.customerOrderService.getMenuCategories(this.companySlug, this.branchSlug).subscribe((cats) => {
      this.categories.set(cats);
      this.activeCategoryId.set(cats[0]?.id ?? null);
    });

    this.customerOrderService.getProducts(this.companySlug, this.branchSlug).subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('No pudimos cargar el menú de esta tienda. Intenta de nuevo.');
        this.loading.set(false);
      },
    });

    this.customerOrderService.getPromotions(this.companySlug, this.branchSlug).subscribe((promos) => this.promotions.set(promos));

    // Solo se puede pedir si se entró por el QR de una mesa Y esa mesa
    // está abierta ahora mismo — un link genérico de la sucursal (sin
    // token) siempre es "solo ver".
    if (this.mesaToken) {
      this.checkSession();
    }
  }

  private checkSession(): void {
    this.customerOrderService.resolveQr(this.companySlug, this.branchSlug, this.mesaToken!).subscribe({
      next: (info) => {
        const token = info.canOrder ? (info.session?.token ?? null) : null;
        this.sessionToken.set(token);
        if (token) saveSessionToken(this.companySlug, this.branchSlug, token);
      },
      error: () => this.sessionToken.set(null), // QR inválido: se queda en modo "solo ver"
    });
  }

  selectCategory(categoryId: string): void {
    this.activeCategoryId.set(categoryId);
    document.getElementById('cat-' + categoryId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  openProductSheet(product: EffectiveProduct): void {
    this.openCombo.set(null);
    this.openProduct.set(product);
  }

  openComboSheet(promo: EffectivePromotion): void {
    this.openProduct.set(null);
    this.openCombo.set(promo);
  }

  closeSheet(): void {
    this.openProduct.set(null);
    this.openCombo.set(null);
  }

  quickAdd(product: EffectiveProduct): void {
    this.cart.add(product, [], 1);
  }

  onAddedFromSheet(payload: { product: EffectiveProduct; modifiers: SelectedModifier[]; quantity: number; notes: string }): void {
    this.cart.add(payload.product, payload.modifiers, payload.quantity, payload.notes);
    this.openProduct.set(null);
  }

  onAddedCombo(payload: AddedComboPayload): void {
    this.cart.addCombo({
      promotionId: payload.promotion.id,
      promotionName: payload.promotion.name,
      selections: payload.selections,
      totalPrice: Number(payload.promotion.effectiveFixedAmount ?? payload.promotion.fixedAmount ?? 0),
      notes: payload.notes,
    });
    this.openCombo.set(null);
  }

  /**
   * El pedido de verdad — solo funciona si canOrder() es true (mesa
   * abierta por la mesera) y ya se escribió el nombre.
   */
  sendOrder(): void {
    const token = this.sessionToken();
    if (this.cart.isEmpty() || !token || this.sendingOrder()) return;
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

    this.customerOrderService
      .createOrder(this.companySlug, this.branchSlug, token, { customerName: this.customerName().trim(), items, combos })
      .subscribe({
        next: (order) => {
          this.sendingOrder.set(false);
          this.cartDrawerOpen.set(false);
          this.cart.clear();
          this.router.navigate(['/', this.companySlug, this.branchSlug, 'pedido', order.id]);
        },
        error: (err) => {
          this.sendingOrder.set(false);
          this.orderError.set(err?.error?.error || 'No pudimos enviar tu pedido. Intenta de nuevo.');
        },
      });
  }
}