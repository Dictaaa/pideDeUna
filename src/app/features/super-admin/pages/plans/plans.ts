import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SuperAdminService } from '../../services/super-admin.service';
import { PlanInfo } from '../../../plan/models/plan.models';
import { ActionsMenu, RowAction } from '../../../../shared/components/actions-menu/actions-menu/actions-menu';
import { TableSkeleton } from '../../../../shared/components/table-skeleton/table-skeleton';

interface PlanFormValue {
  code: string;
  name: string;
  priceMonthly: number;
  maxCategories: number | null;
  maxProducts: number | null;
  maxTables: number | null;
  maxUsers: number | null;
  maxPhotos: number | null;
  maxVideos: number | null;
}

const EMPTY_FORM: PlanFormValue = {
  code: '',
  name: '',
  priceMonthly: 0,
  maxCategories: null,
  maxProducts: null,
  maxTables: null,
  maxUsers: null,
  maxPhotos: null,
  maxVideos: null,
};

@Component({
  selector: 'app-sa-plans',
  standalone: true,
  imports: [DecimalPipe, FormsModule, ActionsMenu, TableSkeleton],
  templateUrl: './plans.html',
  styleUrl: './plans.scss',
})
export class Plans {
  private service = inject(SuperAdminService);

  loading = signal(true);
  plans = signal<PlanInfo[]>([]);

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
    this.service.listPlans().subscribe({
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

  openEdit(plan: PlanInfo): void {
    this.editingId.set(plan.id);
    this.form.set({
      code: plan.code,
      name: plan.name,
      priceMonthly: Number(plan.priceMonthly),
      maxCategories: plan.maxCategories,
      maxProducts: plan.maxProducts,
      maxTables: plan.maxTables,
      maxUsers: plan.maxUsers,
      maxPhotos: plan.maxPhotos,
      maxVideos: plan.maxVideos,
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

  const payload = {
    ...f,
    priceMonthly: String(f.priceMonthly),
  };

  const request = id
    ? this.service.updatePlan(id, payload)
    : this.service.createPlan(payload);

  request.subscribe({
    next: () => {
      this.saving.set(false);
      this.formOpen.set(false);
      this.reload();
    },
    error: (err) => {
      this.saving.set(false);
      this.errorMessage.set(
        err?.error?.error || 'No se pudo guardar el plan.'
      );
    },
  });
}

  toggleActive(plan: PlanInfo & { isActive?: boolean }): void {
    const next = !plan.isActive;
    const verb = next ? 'activar' : 'desactivar';
    if (!confirm(`¿${verb.charAt(0).toUpperCase() + verb.slice(1)} el plan "${plan.name}"?`)) return;

    this.service.updatePlan(plan.id, { isActive: next }).subscribe({ next: () => this.reload() });
  }

  rowActions(plan: PlanInfo & { isActive?: boolean }): RowAction[] {
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