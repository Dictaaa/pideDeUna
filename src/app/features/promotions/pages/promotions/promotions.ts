import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PromotionAdmin } from '../../services/promotion-admin';
import { AdminPromotion, PromotionFormValue } from '../../models/promotion.models';
import { ProductAdmin } from '../../../products/services/product-admin';
import { AdminProduct } from '../../../products/models/product.models';
import { ActionsMenu, RowAction } from '../../../../shared/components/actions-menu/actions-menu/actions-menu';
import { TableSkeleton } from '../../../../shared/components/table-skeleton/table-skeleton';

const EMPTY_FORM: PromotionFormValue = {
  name: '',
  description: '',
  buyQuantity: 2,
  fixedAmount: 0,
  isActive: true,
};

@Component({
  selector: 'app-promotions',
  standalone: true,
  imports: [FormsModule, DecimalPipe, ActionsMenu, TableSkeleton],
  templateUrl: './promotions.html',
  styleUrl: './promotions.scss',
})
export class Promotions {
  private route = inject(ActivatedRoute);
  private service = inject(PromotionAdmin);
  private productService = inject(ProductAdmin);

  slug = this.route.parent!.snapshot.paramMap.get('slug')!;

  loading = signal(true);
  promotions = signal<AdminPromotion[]>([]);
  allProducts = signal<AdminProduct[]>([]);

  formOpen = signal(false);
  editingId = signal<string | null>(null);
  form = signal<PromotionFormValue>({ ...EMPTY_FORM });
  selectedProductIds = signal<Set<string>>(new Set());
  saving = signal(false);
  errorMessage = signal<string | null>(null);

  // Foto de la tarjeta — solo se puede subir una vez que la promoción ya existe.
  editingImageUrl = signal<string | null>(null);
  uploadingImage = signal(false);
  imageError = signal<string | null>(null);

  constructor() {
    this.reload();
    this.productService.list(this.slug).subscribe({ next: (products) => this.allProducts.set(products) });
  }

  reload(): void {
    this.loading.set(true);
    this.service.list(this.slug).subscribe({
      next: (promos) => {
        this.promotions.set(promos);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  productNames(promo: AdminPromotion): string {
    return promo.products.map((p) => p.name).join(', ') || '—';
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.set({ ...EMPTY_FORM });
    this.selectedProductIds.set(new Set());
    this.editingImageUrl.set(null);
    this.imageError.set(null);
    this.errorMessage.set(null);
    this.formOpen.set(true);
  }

  openEdit(promo: AdminPromotion): void {
    this.editingId.set(promo.id);
    this.form.set({
      name: promo.name,
      description: promo.description ?? '',
      buyQuantity: promo.buyQuantity ?? 2,
      fixedAmount: promo.fixedAmount ? Number(promo.fixedAmount) : 0,
      isActive: promo.isActive,
    });
    this.selectedProductIds.set(new Set(promo.products.map((p) => p.id)));
    this.editingImageUrl.set(promo.imageUrl);
    this.imageError.set(null);
    this.errorMessage.set(null);
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
  }

  updateField<K extends keyof PromotionFormValue>(key: K, value: PromotionFormValue[K]): void {
    this.form.set({ ...this.form(), [key]: value });
  }

  isProductSelected(id: string): boolean {
    return this.selectedProductIds().has(id);
  }

  toggleProduct(id: string): void {
    this.selectedProductIds.update((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  save(): void {
    const f = this.form();
    if (!f.name.trim()) {
      this.errorMessage.set('El nombre es obligatorio.');
      return;
    }
    if (f.buyQuantity < 2) {
      this.errorMessage.set('El combo debe ser de al menos 2 unidades.');
      return;
    }
    if (f.fixedAmount <= 0) {
      this.errorMessage.set('El precio del combo debe ser mayor a 0.');
      return;
    }
    if (this.selectedProductIds().size === 0) {
      this.errorMessage.set('Elige al menos un producto para el combo.');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);

    const id = this.editingId();
    const productIds = Array.from(this.selectedProductIds());

    if (id) {
      forkJoin({
        promo: this.service.update(this.slug, id, f),
        products: this.service.setProducts(this.slug, id, productIds),
      }).subscribe({
        next: () => {
          this.saving.set(false);
          this.formOpen.set(false);
          this.reload();
        },
        error: (err) => {
          this.saving.set(false);
          this.errorMessage.set(err?.error?.error || 'No se pudo guardar la promoción.');
        },
      });
      return;
    }

    this.service.create(this.slug, f, productIds).subscribe({
      next: () => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.reload();
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err?.error?.error || 'No se pudo crear la promoción.');
      },
    });
  }

  deactivate(promo: AdminPromotion): void {
    if (!confirm(`¿Desactivar "${promo.name}"? Deja de mostrarse en el menú.`)) return;
    this.service.deactivate(this.slug, promo.id).subscribe({ next: () => this.reload() });
  }

  rowActions(promo: AdminPromotion): RowAction[] {
    const actions: RowAction[] = [{ label: 'Editar', icon: '✏️', handler: () => this.openEdit(promo) }];
    if (promo.isActive) {
      actions.push({ label: 'Desactivar', icon: '⛔', handler: () => this.deactivate(promo), danger: true });
    }
    return actions;
  }

  onImageSelected(event: Event): void {
    const promotionId = this.editingId();
    if (!promotionId) return;

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploadingImage.set(true);
    this.imageError.set(null);

    this.service.uploadImage(this.slug, promotionId, file).subscribe({
      next: (promo) => {
        this.editingImageUrl.set(promo.imageUrl);
        this.uploadingImage.set(false);
        input.value = '';
      },
      error: (err) => {
        this.uploadingImage.set(false);
        this.imageError.set(err?.error?.error || 'No se pudo subir la foto.');
        input.value = '';
      },
    });
  }
}