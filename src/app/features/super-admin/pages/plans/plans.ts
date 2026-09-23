import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlanService } from '../../../../core/services/super-admin.service';
import { Plan } from '../../../../core/models/company.model';
import { ActionsMenu, RowAction } from '../../../../shared/components/actions-menu/actions-menu/actions-menu';
import { TableSkeleton } from '../../../../shared/components/table-skeleton/table-skeleton';

// Refleja el Plan real (maxTables/maxUsers/maxProducts/maxBranches +
// storageQuotaMb) — el modelo viejo tenía maxCategories (nunca existió)
// y maxPhotos/maxVideos (superados por storageQuotaMb desde que armamos
// el cupo por MB).
interface PlanFormValue {
  code: string;
  name: string;
  priceMonthly: number;
  maxProducts: number | null;
  maxTables: number | null;
  maxUsers: number | null;
  maxBranches: number | null;
  storageQuotaMb: number;
}

const EMPTY_FORM: PlanFormValue = {
  code: '',
  name: '',
  priceMonthly: 0,
  maxProducts: null,
  maxTables: null,
  maxUsers: null,
  maxBranches: null,
  storageQuotaMb: 200,
};

@Component({
  selector: 'app-sa-plans',
  standalone: true,
  imports: [DecimalPipe, FormsModule, ActionsMenu, TableSkeleton],
  templateUrl: './plans.html',
  styleUrl: './plans.scss',
})
export class Plans {
  private service = inject(PlanService);

  loading = signal(true);
  plans = signal<Plan[]>([]);

  formOpen = signal(false);
  editingId = signal<string | null>(null);
  form = signal<PlanFormValue>({ ...EMPTY_FORM });
  saving = signal(false);
  errorMessage = signal<string | null>(null);

  constructor() {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.service.list().subscribe({
      next: (plans) => {
        this.plans.set(plans);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.set({ ...EMPTY_FORM });
    this.errorMessage.set(null);
    this.formOpen.set(true);
  }

  openEdit(plan: Plan): void {
    this.editingId.set(plan.id);
    this.form.set({
      code: plan.code,
      name: plan.name,
      priceMonthly: Number(plan.priceMonthly),
      maxProducts: plan.maxProducts,
      maxTables: plan.maxTables,
      maxUsers: plan.maxUsers,
      maxBranches: plan.maxBranches,
      storageQuotaMb: plan.storageQuotaMb,
    });
    this.errorMessage.set(null);
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
  }

  updateField<K extends keyof PlanFormValue>(key: K, value: PlanFormValue[K]): void {
    this.form.set({ ...this.form(), [key]: value });
  }

  save(): void {
    const f = this.form();

    if (!f.name.trim() || (!this.editingId() && !f.code.trim())) {
      this.errorMessage.set('El código y el nombre son obligatorios.');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);

    const id = this.editingId();
    const payload: Partial<Plan> = { ...f };

    const request = id ? this.service.update(id, payload) : this.service.create(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.reload();
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err?.error?.error || 'No se pudo guardar el plan.');
      },
    });
  }

  toggleActive(plan: Plan): void {
    const next = !plan.isActive;
    const verb = next ? 'activar' : 'desactivar';
    if (!confirm(`¿${verb.charAt(0).toUpperCase() + verb.slice(1)} el plan "${plan.name}"?`)) return;

    this.service.update(plan.id, { isActive: next }).subscribe({ next: () => this.reload() });
  }

  rowActions(plan: Plan): RowAction[] {
    return [
      { label: 'Editar', icon: '✏️', handler: () => this.openEdit(plan) },
      {
        label: plan.isActive ? 'Desactivar' : 'Activar',
        icon: plan.isActive ? '⛔' : '✅',
        handler: () => this.toggleActive(plan),
        danger: plan.isActive,
      },
    ];
  }
}