import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuditLogAdmin } from '../../services/audit-log-admin';
import { ACTION_LABELS, AuditLogEntry, ENTITY_TYPE_OPTIONS } from '../../models/audit-log.models';
import { TableSkeleton } from '../../../../shared/components/table-skeleton/table-skeleton';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [FormsModule, TableSkeleton],
  templateUrl: './audit-log.html',
  styleUrl: './audit-log.scss',
})
export class AuditLogPage {
  private route = inject(ActivatedRoute);
  private service = inject(AuditLogAdmin);

  slug = this.route.parent!.snapshot.paramMap.get('slug')!;
  entityTypeOptions = ENTITY_TYPE_OPTIONS;

  loading = signal(true);
  logs = signal<AuditLogEntry[]>([]);
  entityTypeFilter = signal('');
  selectedLog = signal<AuditLogEntry | null>(null);

  constructor() {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.service.list(this.slug, this.entityTypeFilter() || undefined).subscribe({
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

  actorName(log: AuditLogEntry): string {
    const actor = log.User ?? log.user;
    return actor ? `${actor.name} (${actor.email})` : 'Sistema';
  }

  openDetail(log: AuditLogEntry): void {
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