import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AreaService } from '../../../../core/services/table.service';
import { RestaurantArea } from '../../../../core/models/restaurant.model';
import { TableSkeleton } from '../../../../shared/components/table-skeleton/table-skeleton';
import { ActionsMenu, RowAction } from '../../../../shared/components/actions-menu/actions-menu/actions-menu';

// El backend guarda isActive (boolean) — el formulario sigue mostrando
// "Activa"/"Inactiva" como tu versión vieja, se convierte al guardar.
interface AreaFormValue {
  name: string;
  description: string;
  sortOrder: number;
  status: 'active' | 'inactive';
}

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
  private areaService = inject(AreaService);

  // Áreas es de nivel SUCURSAL.
  companySlug = this.route.snapshot.paramMap.get('companySlug')!;
  branchSlug = this.route.snapshot.paramMap.get('branchSlug')!;

  loading = signal(true);
  areas = signal<RestaurantArea[]>([]);

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
    this.areaService.list(this.companySlug, this.branchSlug).subscribe({
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

  openEdit(area: RestaurantArea): void {
    this.editingId.set(area.id);
    this.form.set({
      name: area.name,
      description: area.description ?? '',
      sortOrder: area.sortOrder,
      status: area.isActive ? 'active' : 'inactive',
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
    const f = this.form();
    if (!f.name.trim()) {
      this.errorMessage.set('El nombre es obligatorio.');
      return;
    }
    this.saving.set(true);
    this.errorMessage.set(null);

    const payload = {
      name: f.name,
      description: f.description || undefined,
      sortOrder: f.sortOrder,
      isActive: f.status === 'active',
    };

    const id = this.editingId();
    const request = id
      ? this.areaService.update(this.companySlug, this.branchSlug, id, payload)
      : this.areaService.create(this.companySlug, this.branchSlug, payload);

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

  remove(area: RestaurantArea): void {
    if (!confirm(`¿Eliminar "${area.name}"? Las mesas que la tengan asignada se quedan sin área.`)) return;
    this.areaService.remove(this.companySlug, this.branchSlug, area.id).subscribe({ next: () => this.reload() });
  }

  badgeClass(area: RestaurantArea): string {
    return area.isActive ? 'badge-success' : 'badge-neutral';
  }

  rowActions(area: RestaurantArea): RowAction[] {
    return [
      { label: 'Editar', icon: '✏️', handler: () => this.openEdit(area) },
      { label: 'Eliminar', icon: '🗑️', handler: () => this.remove(area), danger: true },
    ];
  }
}