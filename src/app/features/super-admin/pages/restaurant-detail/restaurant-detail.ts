import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SuperAdminService } from '../../services/super-admin.service';
import { RestaurantDetail } from '../../models/super-admin.models';
import { PlanInfo } from '../../../plan/models/plan.models';

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

@Component({
  selector: 'app-sa-restaurant-detail',
  standalone: true,
  imports: [DecimalPipe, FormsModule, RouterLink],
  templateUrl: './restaurant-detail.html',
  styleUrl: './restaurant-detail.scss',
})
export class RestaurantDetailPage {
  private route = inject(ActivatedRoute);
  private service = inject(SuperAdminService);

  restaurantId = this.route.snapshot.paramMap.get('id')!;
  statusLabel = (s: string) => STATUS_LABELS[s] ?? s;
  badgeClass = (s: string) => 'badge ' + (STATUS_BADGE_CLASS[s] ?? 'badge-neutral');

  loading = signal(true);
  detail = signal<RestaurantDetail | null>(null);
  plans = signal<PlanInfo[]>([]);
  selectedPlanId = signal('');
  changingPlan = signal(false);
  changingStatus = signal(false);
  errorMessage = signal<string | null>(null);

  constructor() {
    this.reload();
    this.service.listPlans().subscribe({ next: (plans) => this.plans.set(plans) });
  }

  reload(): void {
    this.loading.set(true);
    this.service.getRestaurant(this.restaurantId).subscribe({
      next: (d) => {
        this.detail.set(d);
        this.selectedPlanId.set(d.subscription?.plan.id ?? '');
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  changeStatus(status: string): void {
    const verbs: Record<string, string> = {
      active: 'reactivar',
      suspended: 'suspender',
      cancelled: 'cancelar',
      trial: 'volver a poner en prueba',
    };
    if (!confirm(`¿Seguro que quieres ${verbs[status] ?? 'cambiar el estado de'} este restaurante?`)) return;

    this.changingStatus.set(true);
    this.service.setStatus(this.restaurantId, status).subscribe({
      next: () => {
        this.changingStatus.set(false);
        this.reload();
      },
      error: (err) => {
        this.changingStatus.set(false);
        this.errorMessage.set(err?.error?.error || 'No se pudo cambiar el estado.');
      },
    });
  }

  changePlan(): void {
    if (!this.selectedPlanId()) return;
    this.changingPlan.set(true);
    this.errorMessage.set(null);

    this.service.changePlan(this.restaurantId, this.selectedPlanId()).subscribe({
      next: () => {
        this.changingPlan.set(false);
        this.reload();
      },
      error: (err) => {
        this.changingPlan.set(false);
        this.errorMessage.set(err?.error?.error || 'No se pudo cambiar el plan.');
      },
    });
  }
}