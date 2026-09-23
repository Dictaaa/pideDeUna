import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CompanyService } from '../../../../core/services/company.service';
import { PlanService } from '../../../../core/services/super-admin.service';
import { CompanyUsage, UsageItem } from '../../../../core/models/company.model';
import { Plan as PlanInfo } from '../../../../core/models/company.model';
import { Skeleton } from '../../../../shared/components/skeleton/skeleton';

interface UsageRow {
  key: keyof CompanyUsage['usage'];
  label: string;
  icon: string;
}

// Sin "categorías" (nunca tuvo límite propio) ni "fotos"/"videos" por
// separado (se miden juntas en storageMb, no por cantidad de archivos).
const USAGE_ROWS: UsageRow[] = [
  { key: 'products', label: 'Productos', icon: '🍽️' },
  { key: 'tables', label: 'Mesas', icon: '🪑' },
  { key: 'users', label: 'Usuarios', icon: '👥' },
  { key: 'branches', label: 'Sucursales', icon: '🏬' },
  { key: 'storageMb', label: 'Almacenamiento (MB)', icon: '📦' },
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
  private companyService = inject(CompanyService);
  private planService = inject(PlanService);

  // Plan es de nivel COMPAÑÍA — no necesita branchSlug.
  companySlug = this.route.snapshot.paramMap.get('companySlug')!;
  usageRows = USAGE_ROWS;
  statusLabel = (s: string) => STATUS_LABELS[s] ?? s;

  loading = signal(true);
  usage = signal<CompanyUsage | null>(null);
  plans = signal<PlanInfo[]>([]);
  changingPlanId = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  constructor() {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    forkJoin({
      usage: this.companyService.getUsage(this.companySlug),
      plans: this.planService.list(),
    }).subscribe({
      next: (res) => {
        this.usage.set(res.usage);
        this.plans.set(res.plans);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  usageItem(key: keyof CompanyUsage['usage']): UsageItem | null {
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

    this.companyService.changePlan(this.companySlug, plan.id).subscribe({
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