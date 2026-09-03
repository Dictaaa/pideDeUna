import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AreaAdmin } from '../../../area/services/area-admin';
import { AdminArea, AreaFormValue } from '../../../area/models/area.models';
import { TableSkeleton } from '../../../../shared/components/table-skeleton/table-skeleton';
import { ActionsMenu, RowAction } from '../../../../shared/components/actions-menu/actions-menu/actions-menu';

const EMPTY_FORM: AreaFormValue = { name: '', description: '', sortOrder: 0, status: 'active' };

@Component({
  selector: 'app-areas',
  standalone: true,
  imports: [FormsModule, TableSkeleton, ActionsMenu],
  templateUrl: './areas.html',
  styleUrl: './areas.scss',
})
export class Areas {
  private route = inject(ActivatedRoute);
  private areaService = inject(AreaAdmin);

  slug = this.route.parent!.snapshot.paramMap.get('slug')!;

  loading = signal(true);
  areas = signal<AdminArea[]>([]);

  formOpen = signal(false);
  editingId = signal<string | null>(null);
  form = signal<AreaFormValue>({ ...EMPTY_FORM });
  saving = signal(false);
  errorMessage = signal<string | null>(null);

  constructor() {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.areaService.list(this.slug).subscribe({
      next: (areas) => {
        this.areas.set(areas);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.set({ ...EMPTY_FORM, sortOrder: this.areas().length });
    this.errorMessage.set(null);
    this.formOpen.set(true);
  }

  openEdit(area: AdminArea): void {
    this.editingId.set(area.id);
    this.form.set({
      name: area.name,
      description: area.description ?? '',
      sortOrder: area.sortOrder,
      status: area.status,
    });
    this.errorMessage.set(null);
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
  }

  updateField<K extends keyof AreaFormValue>(key: K, value: AreaFormValue[K]): void {
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
    const request = id ? this.areaService.update(this.slug, id, this.form()) : this.areaService.create(this.slug, this.form());

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.reload();
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err?.error?.error || 'No se pudo guardar el área.');
      },
    });
  }

  remove(area: AdminArea): void {
    if (!confirm(`¿Eliminar "${area.name}"? Las mesas que la tengan asignada se quedan sin área.`)) return;
    this.areaService.remove(this.slug, area.id).subscribe({ next: () => this.reload() });
  }

   badgeClass(area: AdminArea): string {
    return area.status === 'active' ? 'badge-success' : 'badge-neutral';
  }

  rowActions(area: AdminArea): RowAction[] {
    return [
      { label: 'Editar', icon: '✏️', handler: () => this.openEdit(area) },
      { label: 'Eliminar', icon: '🗑️', handler: () => this.remove(area), danger: true },
    ];
  }
}