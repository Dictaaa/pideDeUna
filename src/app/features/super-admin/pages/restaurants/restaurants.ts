import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { SuperAdminService } from '../../services/super-admin.service';
import { RestaurantListItem, CreateRestaurantPayload } from '../../models/super-admin.models';
import { PlanInfo } from '../../../plan/models/plan.models';
import { ActionsMenu, RowAction } from '../../../../shared/components/actions-menu/actions-menu/actions-menu';
import { TableSkeleton } from '../../../../shared/components/table-skeleton/table-skeleton';

const STATUS_LABELS: Record<string, string> = {
  trial: 'Prueba',
  active: 'Activo',
  suspended: 'Suspendido',
  cancelled: 'Cancelado',
};
const STATUS_BADGE_CLASS: Record<string, string> = {
  trial: 'badge-warning',
  active: 'badge-success',
  suspended: 'badge-danger',
  cancelled: 'badge-neutral',
};

const EMPTY_FORM: CreateRestaurantPayload = {
  restaurantName: '',
  slug: '',
  adminName: '',
  adminEmail: '',
  adminPassword: '',
  planId: '',
  status: 'trial',
};

@Component({
  selector: 'app-sa-restaurants',
  standalone: true,
  imports: [FormsModule, DecimalPipe, ActionsMenu, TableSkeleton],
  templateUrl: './restaurants.html',
  styleUrl: './restaurants.scss',
})
export class Restaurants {
  private service = inject(SuperAdminService);
  private router = inject(Router);

  statusLabel = (s: string) => STATUS_LABELS[s] ?? s;
  badgeClass = (s: string) => 'badge ' + (STATUS_BADGE_CLASS[s] ?? 'badge-neutral');

  loading = signal(true);
  restaurants = signal<RestaurantListItem[]>([]);
  search = signal('');

  plans = signal<PlanInfo[]>([]);
  formOpen = signal(false);
  form = signal<CreateRestaurantPayload>({ ...EMPTY_FORM });
  saving = signal(false);
  errorMessage = signal<string | null>(null);

  constructor() {
    this.reload();
    this.service.listPlans().subscribe({ next: (plans) => this.plans.set(plans) });
  }

  reload(): void {
    this.loading.set(true);
    this.service.listRestaurants(this.search().trim() || undefined).subscribe({
      next: (rs) => {
        this.restaurants.set(rs);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.reload();
  }

  openCreate(): void {
    this.form.set({ ...EMPTY_FORM, planId: this.plans()[0]?.id ?? '' });
    this.errorMessage.set(null);
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
  }

  updateField<K extends keyof CreateRestaurantPayload>(key: K, value: CreateRestaurantPayload[K]): void {
    this.form.set({ ...this.form(), [key]: value });
  }

  save(): void {
    const f = this.form();
    if (!f.restaurantName.trim() || !f.slug.trim() || !f.adminName.trim() || !f.adminEmail.trim() || !f.adminPassword) {
      this.errorMessage.set('Todos los campos son obligatorios.');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);

    this.service.createRestaurant(f).subscribe({
      next: () => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.reload();
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err?.error?.error || 'No se pudo crear el restaurante.');
      },
    });
  }

  toggleStatus(r: RestaurantListItem): void {
    const next = r.status === 'suspended' ? 'active' : 'suspended';
    const verb = next === 'suspended' ? 'suspender' : 'reactivar';
    if (!confirm(`¿${verb.charAt(0).toUpperCase() + verb.slice(1)} "${r.name}"?`)) return;

    this.service.setStatus(r.id, next).subscribe({ next: () => this.reload() });
  }

  viewDetail(r: RestaurantListItem): void {
    this.router.navigate(['/super-admin/restaurantes', r.id]);
  }

  rowActions(r: RestaurantListItem): RowAction[] {
    const actions: RowAction[] = [{ label: 'Ver detalle', icon: '🔍', handler: () => this.viewDetail(r) }];

    if (r.status === 'suspended') {
      actions.push({ label: 'Reactivar', icon: '✅', handler: () => this.toggleStatus(r) });
    } else {
      actions.push({ label: 'Suspender', icon: '⛔', handler: () => this.toggleStatus(r), danger: true });
    }

    return actions;
  }
}