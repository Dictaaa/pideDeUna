import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ProductAdmin } from '../../services/product-admin';
import { Category } from '../../../categories/services/category';
import { AdminProduct, AdminProductMedia, ProductFormValue } from '../../models/product.models';
import { TableSkeleton } from '../../../../shared/components/table-skeleton/table-skeleton';
import { AdminCategory } from '../../../categories/models/category.models';

const EMPTY_FORM: ProductFormValue = {
  name: '',
  slug: '',
  categoryId: '',
  description: '',
  price: 0,
  isAvailable: true,
  isFeatured: false,
  isRecommended: false,
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [FormsModule, DecimalPipe, TableSkeleton],
  templateUrl: './products.html',
  styleUrl: './products.scss',
})
export class Products {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductAdmin);
  private categoryService = inject(Category);

  slug = this.route.parent!.snapshot.paramMap.get('slug')!;

  loading = signal(true);
  products = signal<AdminProduct[]>([]);
  categories = signal<AdminCategory[]>([]);

  formOpen = signal(false);
  editingId = signal<string | null>(null);
  slugTouched = signal(false);
  form = signal<ProductFormValue>({ ...EMPTY_FORM });
  saving = signal(false);
  errorMessage = signal<string | null>(null);

  currentMedia = signal<AdminProductMedia[]>([]);
  uploadingMedia = signal(false);
  mediaError = signal<string | null>(null);

  constructor() {
    this.reload();
    this.categoryService.list(this.slug).subscribe({ next: (cats) => this.categories.set(cats) });
  }

  reload(): void {
    this.loading.set(true);
    this.productService.list(this.slug).subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  categoryName(categoryId: string | null): string {
    if (!categoryId) return '—';
    return this.categories().find((c) => c.id === categoryId)?.name ?? '—';
  }

  openCreate(): void {
    this.editingId.set(null);
    this.slugTouched.set(false);
    this.currentMedia.set([]);
    this.mediaError.set(null);
    this.form.set({ ...EMPTY_FORM, categoryId: this.categories()[0]?.id ?? '' });
    this.errorMessage.set(null);
    this.formOpen.set(true);
  }

  openEdit(product: AdminProduct): void {
    this.editingId.set(product.id);
    this.slugTouched.set(true);
    this.currentMedia.set(product.media ?? []);
    this.mediaError.set(null);
    this.form.set({
      name: product.name,
      slug: product.slug,
      categoryId: product.categoryId ?? '',
      description: product.description ?? '',
      price: Number(product.price),
      isAvailable: product.isAvailable,
      isFeatured: product.isFeatured,
      isRecommended: product.isRecommended,
    });
    this.errorMessage.set(null);
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
  }

  updateField<K extends keyof ProductFormValue>(key: K, value: ProductFormValue[K]): void {
    this.form.set({ ...this.form(), [key]: value });
  }

  onNameChange(value: string): void {
    this.updateField('name', value);
    if (!this.slugTouched()) {
      this.updateField('slug', slugify(value));
    }
  }

  onSlugChange(value: string): void {
    this.slugTouched.set(true);
    this.updateField('slug', slugify(value));
  }

  save(): void {
    const f = this.form();
    if (!f.name.trim() || !f.slug.trim() || f.price <= 0) {
      this.errorMessage.set('Nombre, slug y un precio mayor a 0 son obligatorios.');
      return;
    }
    this.saving.set(true);
    this.errorMessage.set(null);

    const id = this.editingId();

    if (id) {
      this.productService.update(this.slug, id, f).subscribe({
        next: () => {
          this.saving.set(false);
          this.formOpen.set(false);
          this.reload();
        },
        error: (err) => {
          this.saving.set(false);
          this.errorMessage.set(err?.error?.error || 'No se pudo guardar el producto.');
        },
      });
      return;
    }

    // Al crear, dejamos el panel abierto y pasamos a modo edición —
    // así se puede subir la foto/video de una vez, sin tener que
    // volver a abrir el producto (el endpoint de media necesita el id,
    // que solo existe después de este primer guardado).
    this.productService.create(this.slug, f).subscribe({
      next: (created) => {
        this.saving.set(false);
        this.editingId.set(created.id);
        this.slugTouched.set(true);
        this.currentMedia.set(created.media ?? []);
        this.reload();
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err?.error?.error || 'No se pudo guardar el producto.');
      },
    });
  }

  remove(product: AdminProduct): void {
    if (!confirm(`¿Eliminar "${product.name}"?`)) return;
    this.productService.remove(this.slug, product.id).subscribe({ next: () => this.reload() });
  }

  /** Se llama al elegir un archivo en el input de fotos/video del producto que se está editando. */
  onMediaSelected(event: Event): void {
    const productId = this.editingId();
    if (!productId) return;

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploadingMedia.set(true);
    this.mediaError.set(null);
    const isPrimary = this.currentMedia().length === 0; // el primero que sube queda como principal

    this.productService.uploadMedia(this.slug, productId, file, isPrimary).subscribe({
      next: (media) => {
        this.currentMedia.set([...this.currentMedia(), media]);
        this.uploadingMedia.set(false);
        input.value = ''; // permite volver a elegir el mismo archivo si hace falta
      },
      error: (err) => {
        this.uploadingMedia.set(false);
        this.mediaError.set(err?.error?.error || 'No se pudo subir el archivo.');
        input.value = '';
      },
    });
  }

  removeMedia(media: AdminProductMedia): void {
    const productId = this.editingId();
    if (!productId) return;
    if (!confirm('¿Eliminar este archivo?')) return;

    this.productService.removeMedia(this.slug, productId, media.id).subscribe({
      next: () => this.currentMedia.set(this.currentMedia().filter((m) => m.id !== media.id)),
    });
  }
}
