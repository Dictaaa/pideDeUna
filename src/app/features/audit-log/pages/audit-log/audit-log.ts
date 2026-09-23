import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuditLogService } from '../../../../core/services/audit-log.service';
import { AuditLog } from '../../../../core/models/audit.model';
import { TableSkeleton } from '../../../../shared/components/table-skeleton/table-skeleton';

// No exhaustivo — cubre las acciones más comunes que ya registra
// audit.service.ts (logAction()). Lo que no esté acá se muestra tal
// cual llegó del backend (ver actionLabel()).
const ACTION_LABELS: Record<string, string> = {
  'user.create': 'Creó un usuario',
  'user.update': 'Editó un usuario',
  'user.remove': 'Eliminó un usuario',
  'user.role_add': 'Agregó un rol',
  'user.role_remove': 'Quitó un rol',
  'order.cancel': 'Canceló un pedido',
  'order.charge': 'Cobró un pedido',
  'payment.refund': 'Reembolsó un pago',
  'product.create': 'Creó un producto',
  'product.update': 'Editó un producto',
  'product.remove': 'Eliminó un producto',
  'promotion.create': 'Creó una promoción',
  'promotion.update': 'Editó una promoción',
  'company.status_change': 'Cambió el estado de la compañía',
  'company.plan_change': 'Cambió de plan',
};

const ENTITY_TYPE_OPTIONS = [
  'User', 'Order', 'Payment', 'Product', 'Promotion', 'MenuCategory',
  'ModifierGroup', 'Table', 'RestaurantArea', 'Company', 'Restaurant',
];

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [FormsModule, TableSkeleton],
  templateUrl: './audit-log.html',
  styleUrl: './audit-log.scss',
})
export class AuditLogPage {
  private route = inject(ActivatedRoute);
  private service = inject(AuditLogService);

  // Auditoría es de nivel COMPAÑÍA — no necesita branchSlug.
  companySlug = this.route.snapshot.paramMap.get('companySlug')!;
  entityTypeOptions = ENTITY_TYPE_OPTIONS;

  loading = signal(true);
  logs = signal<AuditLog[]>([]);
  entityTypeFilter = signal('');
  selectedLog = signal<AuditLog | null>(null);

  constructor() {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.service
      .list(this.companySlug, this.entityTypeFilter() ? { entityType: this.entityTypeFilter() } : undefined)
      .subscribe({
        next: (logs) => {
          this.logs.set(logs);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  applyFilter(): void {
    this.reload();
  }

  clearFilter(): void {
    this.entityTypeFilter.set('');
    this.reload();
  }

  actionLabel(action: string): string {
    return ACTION_LABELS[action] ?? action;
  }

  actorName(log: AuditLog): string {
    return log.user ? `${log.user.name} (${log.user.email})` : 'Sistema';
  }

  openDetail(log: AuditLog): void {
    this.selectedLog.set(log);
  }

  closeDetail(): void {
    this.selectedLog.set(null);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  formatValues(values: Record<string, unknown> | null): string {
    if (!values) return '—';
    return JSON.stringify(values, null, 2);
  }
}