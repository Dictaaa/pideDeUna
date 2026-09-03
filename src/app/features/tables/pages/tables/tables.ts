import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import QRCode from 'qrcode';
import { TableAdmin } from '../../services/table-admin';
import { AdminArea, AdminTable, TABLE_STATUSES, TableFormValue } from '../../models/table.models';
import { TableSkeleton } from '../../../../shared/components/table-skeleton/table-skeleton';
import { ActionsMenu, RowAction } from '../../../../shared/components/actions-menu/actions-menu/actions-menu';

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

// Un color por estado — para reconocer de un vistazo en qué anda cada mesa.
const STATUS_BADGE_CLASS: Record<string, string> = {
  AVAILABLE: 'badge-success',
  OCCUPIED: 'badge-danger',
  WAITING_ORDER: 'badge-warning',
  ORDERING: 'badge-info',
  WAITING_PAYMENT: 'badge-purple',
  CLEANING: 'badge-teal',
  DISABLED: 'badge-neutral',
};

@Component({
  selector: 'app-tables',
  standalone: true,
  imports: [FormsModule, TableSkeleton, ActionsMenu],
  templateUrl: './tables.html',
  styleUrl: './tables.scss',
})
export class Tables {
  private route = inject(ActivatedRoute);
  private tableService = inject(TableAdmin);

  slug = this.route.parent!.snapshot.paramMap.get('slug')!;
  statuses = TABLE_STATUSES;
  statusLabel = (s: string) => STATUS_LABELS[s] ?? s;
  badgeClass = (s: string) => STATUS_BADGE_CLASS[s] ?? 'badge-neutral';

  loading = signal(true);
  tables = signal<AdminTable[]>([]);
  areas = signal<AdminArea[]>([]);

  formOpen = signal(false);
  editingId = signal<string | null>(null);
  form = signal<TableFormValue>({ ...EMPTY_FORM });
  saving = signal(false);
  errorMessage = signal<string | null>(null);

  qrPreviewTable = signal<AdminTable | null>(null);
  qrPreviewImage = signal<string | null>(null);
  qrGenerating = signal(false);

  toastMessage = signal<string | null>(null);

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
    navigator.clipboard.writeText(url).then(() => this.showToast('Link copiado'));
  }

  private showToast(message: string): void {
    this.toastMessage.set(message);
    setTimeout(() => this.toastMessage.set(null), 1800);
  }

  regenerateQr(table: AdminTable): void {
    if (!confirm(`¿Regenerar el QR de la mesa ${table.tableNumber}? El código impreso anterior dejará de servir.`)) return;
    this.tableService.regenerateQr(this.slug, table.id).subscribe({ next: () => this.reload() });
  }

  openQrPreview(table: AdminTable): void {
    const url = this.qrUrl(table);
    if (!url) return;

    this.qrPreviewTable.set(table);
    this.qrGenerating.set(true);
    QRCode.toDataURL(url, { width: 480, margin: 2 })
      .then((dataUrl) => {
        this.qrPreviewImage.set(dataUrl);
        this.qrGenerating.set(false);
      })
      .catch(() => this.qrGenerating.set(false));
  }

  closeQrPreview(): void {
    this.qrPreviewTable.set(null);
    this.qrPreviewImage.set(null);
  }

  downloadQr(table: AdminTable): void {
    const image = this.qrPreviewImage();
    if (!image) return;

    const link = document.createElement('a');
    link.href = image;
    link.download = `mesa-${table.tableNumber}-qr.png`;
    link.click();
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

  rowActions(table: AdminTable): RowAction[] {
    const actions: RowAction[] = [];

    if (this.activeToken(table)) {
      actions.push(
        { label: 'Ver QR', icon: '📱', handler: () => this.openQrPreview(table) },
        { label: 'Copiar link', icon: '🔗', handler: () => this.copyQrLink(table) },
        { label: 'Regenerar QR', icon: '🔄', handler: () => this.regenerateQr(table) }
      );
    }

    actions.push(
      { label: 'Editar', icon: '✏️', handler: () => this.openEdit(table) },
      { label: 'Eliminar', icon: '🗑️', handler: () => this.remove(table), danger: true }
    );

    return actions;
  }
}