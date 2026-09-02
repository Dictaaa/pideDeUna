import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Category } from '../../services/category';
import { AdminCategory, CategoryFormValue } from '../../models/category.models';
import { TableSkeleton } from '../../../../shared/components/table-skeleton/table-skeleton';

const EMPTY_FORM: CategoryFormValue = { name: '', description: '', sortOrder: 0, isActive: true };

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [FormsModule, TableSkeleton],
  templateUrl: './categories.html',
  styleUrl: './categories.scss',
})
export class Categories {
  private route = inject(ActivatedRoute);
  private categoryService = inject(Category);

  slug = this.route.parent!.snapshot.paramMap.get('slug')!;

  loading = signal(true);
  categories = signal<AdminCategory[]>([]);

  formOpen = signal(false);
  editingId = signal<string | null>(null);
  form = signal<CategoryFormValue>({ ...EMPTY_FORM });
  saving = signal(false);
  errorMessage = signal<string | null>(null);

  constructor() {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.categoryService.list(this.slug).subscribe({
      next: (cats) => {
        this.categories.set(cats);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.set({ ...EMPTY_FORM, sortOrder: this.categories().length });
    this.errorMessage.set(null);
    this.formOpen.set(true);
  }

  openEdit(cat: AdminCategory): void {
    this.editingId.set(cat.id);
    this.form.set({
      name: cat.name,
      description: cat.description ?? '',
      sortOrder: cat.sortOrder,
      isActive: cat.isActive,
    });
    this.errorMessage.set(null);
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
  }

  updateField<K extends keyof CategoryFormValue>(key: K, value: CategoryFormValue[K]): void {
    this.form.set({ ...this.form(), [key]: value });
  }

  save(): void {
    if (!this.form().name.trim()) {
      this.errorMessage.set('El nombre es obligatorio.');
      return;
    }
    this.saving.set(true);
    this.errorMessage.set(null);

    const id = this.editingId();
    const request = id
      ? this.categoryService.update(this.slug, id, this.form())
      : this.categoryService.create(this.slug, this.form());

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.reload();
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err?.error?.error || 'No se pudo guardar la categoría.');
      },
    });
  }

  remove(cat: AdminCategory): void {
    if (!confirm(`¿Eliminar "${cat.name}"? Los productos que tenga quedan sin categoría.`)) return;
    this.categoryService.remove(this.slug, cat.id).subscribe({ next: () => this.reload() });
  }
}
