import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TableAdmin } from '../../services/table-admin';
import { AdminArea, AdminTable, TABLE_STATUSES, TableFormValue } from '../../models/table.models';
import { TableSkeleton } from '../../../../shared/components/table-skeleton/table-skeleton';

const EMPTY_FORM: TableFormValue = { tableNumber: '', name: '', areaId: '', capacity: 4, status: 'AVAILABLE' };

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Disponible',
  OCCUPIED: 'Ocupada',
  WAITING_ORDER: 'Esperando pedido',
  ORDERING: 'Pidiendo',
  WAITING_PAYMENT: 'Esperando pago',
  CLEANING: 'En limpieza',
  DISABLED: 'Deshabilitada',
};

@Component({
  selector: 'app-tables',
  standalone: true,
  imports: [FormsModule, TableSkeleton],
  templateUrl: './tables.html',
  styleUrl: './tables.scss',
})
export class Tables {
  private route = inject(ActivatedRoute);
  private tableService = inject(TableAdmin);

  slug = this.route.parent!.snapshot.paramMap.get('slug')!;
  statuses = TABLE_STATUSES;
  statusLabel = (s: string) => STATUS_LABELS[s] ?? s;

  loading = signal(true);
  tables = signal<AdminTable[]>([]);
  areas = signal<AdminArea[]>([]);

  formOpen = signal(false);
  editingId = signal<string | null>(null);
  form = signal<TableFormValue>({ ...EMPTY_FORM });
  saving = signal(false);
  errorMessage = signal<string | null>(null);

  qrCopiedId = signal<string | null>(null);

  constructor() {
    this.reload();
    this.tableService.listAreas(this.slug).subscribe({ next: (areas) => this.areas.set(areas) });
  }

  reload(): void {
    this.loading.set(true);
    this.tableService.list(this.slug).subscribe({
      next: (tables) => {
        this.tables.set(tables);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  activeToken(table: AdminTable): string | null {
    return table.qrCodes.find((q) => q.isActive)?.token ?? null;
  }

  qrUrl(table: AdminTable): string {
    const token = this.activeToken(table);
    return token ? `${location.origin}/${this.slug}/mesa/${token}` : '';
  }

  copyQrLink(table: AdminTable): void {
    const url = this.qrUrl(table);
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      this.qrCopiedId.set(table.id);
      setTimeout(() => this.qrCopiedId.set(null), 1500);
    });
  }

  regenerateQr(table: AdminTable): void {
    if (!confirm(`¿Regenerar el QR de la mesa ${table.tableNumber}? El código impreso anterior dejará de servir.`)) return;
    this.tableService.regenerateQr(this.slug, table.id).subscribe({ next: () => this.reload() });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.set({ ...EMPTY_FORM, areaId: this.areas()[0]?.id ?? '' });
    this.errorMessage.set(null);
    this.formOpen.set(true);
  }

  openEdit(table: AdminTable): void {
    this.editingId.set(table.id);
    this.form.set({
      tableNumber: table.tableNumber,
      name: table.name ?? '',
      areaId: table.areaId ?? '',
      capacity: table.capacity,
      status: table.status,
    });
    this.errorMessage.set(null);
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
  }

  updateField<K extends keyof TableFormValue>(key: K, value: TableFormValue[K]): void {
    this.form.set({ ...this.form(), [key]: value });
  }

  save(): void {
    if (!this.form().tableNumber.trim()) {
      this.errorMessage.set('El número de mesa es obligatorio.');
      return;
    }
    this.saving.set(true);
    this.errorMessage.set(null);

    const id = this.editingId();
    const request = id ? this.tableService.update(this.slug, id, this.form()) : this.tableService.create(this.slug, this.form());

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.reload();
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err?.error?.error || 'No se pudo guardar la mesa.');
      },
    });
  }

  remove(table: AdminTable): void {
    if (!confirm(`¿Eliminar la mesa ${table.tableNumber}?`)) return;
    this.tableService.remove(this.slug, table.id).subscribe({ next: () => this.reload() });
  }
}
