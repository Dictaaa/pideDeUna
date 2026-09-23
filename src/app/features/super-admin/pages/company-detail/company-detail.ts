import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CompanyDetail, SuperAdminCompanyService } from '../../../../core/services/super-admin.service';
import { PlanService } from '../../../../core/services/super-admin.service';
import { Plan } from '../../../../core/models/company.model';
import { CompanyStatus } from '../../../../core/models/common.model';
import { UserRole } from '../../../../core/models/user.model';

const STATUS_LABELS: Record<CompanyStatus, string> = {
  trial: 'Prueba',
  active: 'Activo',
  suspended: 'Suspendido',
  cancelled: 'Cancelado',
};
const STATUS_BADGE_CLASS: Record<CompanyStatus, string> = {
  trial: 'badge-warning',
  active: 'badge-success',
  suspended: 'badge-danger',
  cancelled: 'badge-neutral',
};

@Component({
  selector: 'app-sa-company-detail',
  standalone: true,
  imports: [DecimalPipe, FormsModule, RouterLink],
  templateUrl: './company-detail.html',
  styleUrl: './company-detail.scss',
})
export class CompanyDetailPage {
  private route = inject(ActivatedRoute);
  private service = inject(SuperAdminCompanyService);
  private planService = inject(PlanService);

  companyId = this.route.snapshot.paramMap.get('id')!;
  statusLabel = (s: CompanyStatus) => STATUS_LABELS[s] ?? s;
  badgeClass = (s: CompanyStatus) => 'badge ' + (STATUS_BADGE_CLASS[s] ?? 'badge-neutral');

  loading = signal(true);
  detail = signal<CompanyDetail | null>(null);
  plans = signal<Plan[]>([]);
  selectedPlanId = signal('');
  changingPlan = signal(false);
  changingStatus = signal(false);
  errorMessage = signal<string | null>(null);

  constructor() {
    this.reload();
    this.planService.list().subscribe({ next: (plans) => this.plans.set(plans) });
  }

  reload(): void {
    this.loading.set(true);
    this.service.getDetail(this.companyId).subscribe({
      next: (d) => {
        this.detail.set(d);
        this.selectedPlanId.set(d.subscription?.plan?.id ?? '');
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  userRoleLabels(userRoles: UserRole[] | undefined): string {
    return (userRoles ?? []).map((ur) => ur.role?.name ?? ur.roleId).join(', ') || '—';
  }

  changeStatus(status: CompanyStatus): void {
    const verbs: Record<CompanyStatus, string> = {
      active: 'reactivar',
      suspended: 'suspender',
      cancelled: 'cancelar',
      trial: 'volver a poner en prueba',
    };
    if (!confirm(`¿Seguro que quieres ${verbs[status] ?? 'cambiar el estado de'} esta compañía?`)) return;

    this.changingStatus.set(true);
    this.service.updateStatus(this.companyId, status).subscribe({
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

    this.service.changePlan(this.companyId, this.selectedPlanId()).subscribe({
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