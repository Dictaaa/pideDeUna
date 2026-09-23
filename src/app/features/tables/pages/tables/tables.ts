import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import QRCode from 'qrcode';
import { AreaService, TableService, TableSessionService } from '../../../../core/services/table.service';
import { RestaurantArea } from '../../../../core/models/restaurant.model';
import { RestaurantTable } from '../../../../core/models/table.model';
import { TableStatus } from '../../../../core/models/common.model';
import { TableSkeleton } from '../../../../shared/components/table-skeleton/table-skeleton';
import { ActionsMenu, RowAction } from '../../../../shared/components/actions-menu/actions-menu/actions-menu';

interface TableFormValue {
  tableNumber: string;
  name: string;
  areaId: string;
  capacity: number;
  status: TableStatus;
}

const EMPTY_FORM: TableFormValue = { tableNumber: '', name: '', areaId: '', capacity: 4, status: 'AVAILABLE' };

const TABLE_STATUSES: TableStatus[] = [
  'AVAILABLE', 'OCCUPIED', 'WAITING_ORDER', 'ORDERING', 'WAITING_PAYMENT', 'CLEANING', 'DISABLED',
];

const STATUS_LABELS: Record<TableStatus, string> = {
  AVAILABLE: 'Disponible',
  OCCUPIED: 'Ocupada',
  WAITING_ORDER: 'Esperando pedido',
  ORDERING: 'Pidiendo',
  WAITING_PAYMENT: 'Esperando pago',
  CLEANING: 'En limpieza',
  DISABLED: 'Deshabilitada',
};

// Un color por estado — para reconocer de un vistazo en qué anda cada mesa.
const STATUS_BADGE_CLASS: Record<TableStatus, string> = {
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
  private tableService = inject(TableService);
  private areaService = inject(AreaService);
  private tableSessionService = inject(TableSessionService);

  togglingSessionId = signal<string | null>(null);

  // Mesas es de nivel SUCURSAL.
  companySlug = this.route.snapshot.paramMap.get('companySlug')!;
  branchSlug = this.route.snapshot.paramMap.get('branchSlug')!;

  statuses = TABLE_STATUSES;
  statusLabel = (s: TableStatus) => STATUS_LABELS[s] ?? s;
  badgeClass = (s: TableStatus) => STATUS_BADGE_CLASS[s] ?? 'badge-neutral';

  loading = signal(true);
  tables = signal<RestaurantTable[]>([]);
  areas = signal<RestaurantArea[]>([]);

  formOpen = signal(false);
  editingId = signal<string | null>(null);
  form = signal<TableFormValue>({ ...EMPTY_FORM });
  saving = signal(false);
  errorMessage = signal<string | null>(null);

  qrPreviewTable = signal<RestaurantTable | null>(null);
  qrPreviewImage = signal<string | null>(null);
  qrGenerating = signal(false);

  toastMessage = signal<string | null>(null);

  constructor() {
    this.reload();
    this.areaService.list(this.companySlug, this.branchSlug).subscribe({ next: (areas) => this.areas.set(areas) });
  }

  reload(): void {
    this.loading.set(true);
    this.tableService.list(this.companySlug, this.branchSlug).subscribe({
      next: (tables) => {
        this.tables.set(tables);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  /** No hay un boolean "hasOpenSession" del backend — lo derivamos de sessions[]. */
  hasOpenSession(table: RestaurantTable): boolean {
    return (table.sessions?.length ?? 0) > 0;
  }

  private openSessionId(table: RestaurantTable): string | null {
    return table.sessions?.[0]?.id ?? null;
  }

  activeToken(table: RestaurantTable): string | null {
    return table.qrCodes?.find((q) => q.isActive)?.token ?? null;
  }

  qrUrl(table: RestaurantTable): string {
    const token = this.activeToken(table);
    return token ? `${location.origin}/${this.companySlug}/${this.branchSlug}/mesa/${token}` : '';
  }

  copyQrLink(table: RestaurantTable): void {
    const url = this.qrUrl(table);
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => this.showToast('Link copiado'));
  }

  private showToast(message: string): void {
    this.toastMessage.set(message);
    setTimeout(() => this.toastMessage.set(null), 1800);
  }

  regenerateQr(table: RestaurantTable): void {
    if (!confirm(`¿Regenerar el QR de la mesa ${table.tableNumber}? El código impreso anterior dejará de servir.`)) return;
    this.tableService.regenerateQr(this.companySlug, this.branchSlug, table.id).subscribe({ next: () => this.reload() });
  }

  openQrPreview(table: RestaurantTable): void {
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

  downloadQr(table: RestaurantTable): void {
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

  openEdit(table: RestaurantTable): void {
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
    const onError = (err: { error?: { error?: string } }) => {
      this.saving.set(false);
      this.errorMessage.set(err?.error?.error || 'No se pudo guardar la mesa.');
    };
    const onSuccess = () => {
      this.saving.set(false);
      this.formOpen.set(false);
      this.reload();
    };

    if (id) {
      this.tableService.update(this.companySlug, this.branchSlug, id, this.form()).subscribe({ next: onSuccess, error: onError });
    } else {
      // create() devuelve { table, qr } (distinto de update(), que
      // devuelve la mesa sola) — no comparten tipo, así que van en
      // ramas separadas en vez de una sola variable "request".
      this.tableService.create(this.companySlug, this.branchSlug, this.form()).subscribe({ next: onSuccess, error: onError });
    }
  }

  remove(table: RestaurantTable): void {
    if (!confirm(`¿Eliminar la mesa ${table.tableNumber}?`)) return;
    this.tableService.remove(this.companySlug, this.branchSlug, table.id).subscribe({ next: () => this.reload() });
  }

  rowActions(table: RestaurantTable): RowAction[] {
    const actions: RowAction[] = [];

    if (this.activeToken(table)) {
      const isOpen = this.hasOpenSession(table);
      actions.push(
        {
          label: isOpen ? '🔴 Cerrar mesa (dejar de recibir pedidos)' : '🟢 Abrir mesa (permitir pedir)',
          icon: isOpen ? '🔴' : '🟢',
          handler: () => this.toggleSession(table),
        },
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

  toggleSession(table: RestaurantTable): void {
    this.togglingSessionId.set(table.id);

    if (this.hasOpenSession(table)) {
      const sessionId = this.openSessionId(table);
      if (!sessionId) {
        this.togglingSessionId.set(null);
        return;
      }
      this.tableSessionService.close(this.companySlug, this.branchSlug, sessionId).subscribe({
        next: () => {
          this.togglingSessionId.set(null);
          this.showToast('Mesa cerrada — ya no se puede pedir');
          this.reload();
        },
        error: () => this.togglingSessionId.set(null),
      });
      return;
    }

    this.tableService.openSession(this.companySlug, this.branchSlug, table.id).subscribe({
      next: () => {
        this.togglingSessionId.set(null);
        this.showToast('Mesa abierta — ya se puede pedir');
        this.reload();
      },
      error: () => this.togglingSessionId.set(null),
    });
  }
}