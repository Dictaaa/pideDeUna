import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PlanAdmin } from '../../services/plan-admin';
import { PlanInfo, SubscriptionUsage, UsageItem } from '../../models/plan.models';
import { Skeleton } from '../../../../shared/components/skeleton/skeleton';

interface UsageRow {
  key: keyof SubscriptionUsage['usage'];
  label: string;
  icon: string;
}

const USAGE_ROWS: UsageRow[] = [
  { key: 'categories', label: 'Categorías', icon: '🗂️' },
  { key: 'products', label: 'Productos', icon: '🍽️' },
  { key: 'tables', label: 'Mesas', icon: '🪑' },
  { key: 'users', label: 'Usuarios', icon: '👥' },
  { key: 'photos', label: 'Fotos', icon: '📸' },
  { key: 'videos', label: 'Videos', icon: '🎥' },
];

const STATUS_LABELS: Record<string, string> = {
  trial: 'Período de prueba',
  active: 'Activo',
  past_due: 'Pago pendiente',
  cancelled: 'Cancelado',
  expired: 'Vencido',
};

@Component({
  selector: 'app-plan',
  standalone: true,
  imports: [DecimalPipe, Skeleton],
  templateUrl: './plan.html',
  styleUrl: './plan.scss',
})
export class Plan {
  private route = inject(ActivatedRoute);
  private planService = inject(PlanAdmin);

  slug = this.route.parent!.snapshot.paramMap.get('slug')!;
  usageRows = USAGE_ROWS;
  statusLabel = (s: string) => STATUS_LABELS[s] ?? s;

  loading = signal(true);
  usage = signal<SubscriptionUsage | null>(null);
  plans = signal<PlanInfo[]>([]);
  changingPlanId = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  constructor() {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    forkJoin({
      usage: this.planService.getUsage(this.slug),
      plans: this.planService.listPlans(),
    }).subscribe({
      next: (res) => {
        this.usage.set(res.usage);
        this.plans.set(res.plans);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  usageItem(key: keyof SubscriptionUsage['usage']): UsageItem | null {
    return this.usage()?.usage[key] ?? null;
  }

  usagePct(item: UsageItem): number {
    if (item.limit === null) return 0; // sin límite, no tiene sentido una barra
    if (item.limit === 0) return 100;
    return Math.min(100, Math.round((item.used / item.limit) * 100));
  }

  isNearLimit(item: UsageItem): boolean {
    return item.limit !== null && item.used >= item.limit;
  }

  isCurrentPlan(plan: PlanInfo): boolean {
    return this.usage()?.plan.id === plan.id;
  }

  trialEndsLabel(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  changePlan(plan: PlanInfo): void {
    if (this.isCurrentPlan(plan)) return;
    if (!confirm(`¿Cambiar al plan ${plan.name}?`)) return;

    this.changingPlanId.set(plan.id);
    this.errorMessage.set(null);

    this.planService.changePlan(this.slug, plan.id).subscribe({
      next: () => {
        this.changingPlanId.set(null);
        this.reload();
      },
      error: (err) => {
        this.changingPlanId.set(null);
        this.errorMessage.set(err?.error?.error || 'No se pudo cambiar de plan.');
      },
    });
  }
}