import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CompanyWithSubscriptions, SuperAdminCompanyService } from '../../../../core/services/super-admin.service';
import { CompanyStatus } from '../../../../core/models/common.model';
import { ActionsMenu, RowAction } from '../../../../shared/components/actions-menu/actions-menu/actions-menu';
import { TableSkeleton } from '../../../../shared/components/table-skeleton/table-skeleton';

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

interface CreateCompanyFormValue {
  name: string;
  slug: string;
  nit: string;
  restaurantName: string;
  restaurantSlug: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

const EMPTY_FORM: CreateCompanyFormValue = {
  name: '',
  slug: '',
  nit: '',
  restaurantName: '',
  restaurantSlug: '',
  adminName: '',
  adminEmail: '',
  adminPassword: '',
};

@Component({
  selector: 'app-sa-companies',
  standalone: true,
  imports: [FormsModule, ActionsMenu, TableSkeleton],
  templateUrl: './companies.html',
  styleUrl: './companies.scss',
})
export class Companies {
  private service = inject(SuperAdminCompanyService);
  private router = inject(Router);

  statusLabel = (s: CompanyStatus) => STATUS_LABELS[s] ?? s;
  badgeClass = (s: CompanyStatus) => 'badge ' + (STATUS_BADGE_CLASS[s] ?? 'badge-neutral');

  loading = signal(true);
  companies = signal<CompanyWithSubscriptions[]>([]);
  search = signal('');

  formOpen = signal(false);
  form = signal<CreateCompanyFormValue>({ ...EMPTY_FORM });
  saving = signal(false);
  errorMessage = signal<string | null>(null);

  constructor() {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.service.list().subscribe({
      next: (companies) => {
        this.companies.set(companies);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // La búsqueda no pega al backend — filtra en el navegador, sobre lo
  // que ya se cargó (list() no soporta un parámetro de búsqueda).
  filteredCompanies(): CompanyWithSubscriptions[] {
    const term = this.search().trim().toLowerCase();
    if (!term) return this.companies();
    return this.companies().filter(
      (c) => c.name.toLowerCase().includes(term) || c.slug.toLowerCase().includes(term)
    );
  }

  currentPlanName(c: CompanyWithSubscriptions): string {
    return c.subscriptions?.[0]?.plan?.name ?? 'Sin plan';
  }

  branchesCount(c: CompanyWithSubscriptions): number {
    return c.restaurants?.length ?? 0;
  }

  openCreate(): void {
    this.form.set({ ...EMPTY_FORM });
    this.errorMessage.set(null);
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
  }

  updateField<K extends keyof CreateCompanyFormValue>(key: K, value: CreateCompanyFormValue[K]): void {
    this.form.set({ ...this.form(), [key]: value });
  }

  save(): void {
    const f = this.form();
    if (
      !f.name.trim() || !f.slug.trim() || !f.restaurantName.trim() || !f.restaurantSlug.trim() ||
      !f.adminName.trim() || !f.adminEmail.trim() || !f.adminPassword
    ) {
      this.errorMessage.set('Todos los campos son obligatorios (menos el NIT).');
      return;
    }
    if (f.adminPassword.length < 8) {
      this.errorMessage.set('La contraseña del administrador debe tener al menos 8 caracteres.');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);

    this.service
      .create({
        name: f.name,
        slug: f.slug,
        nit: f.nit || undefined,
        restaurantName: f.restaurantName,
        restaurantSlug: f.restaurantSlug,
      })
      .subscribe({
        next: (result) => {
          // Segundo paso, aparte: la compañía y su primera sucursal ya
          // existen, ahora se crea el usuario que va a poder entrar.
          this.service.createAdminUser(result.company.id, {
            name: f.adminName,
            email: f.adminEmail,
            password: f.adminPassword,
          }).subscribe({
            next: () => {
              this.saving.set(false);
              this.formOpen.set(false);
              this.reload();
            },
            error: (err) => {
              // La compañía sí quedó creada — hay que decirlo claro,
              // porque si no, alguien podría intentar crearla de nuevo.
              this.saving.set(false);
              this.errorMessage.set(
                'La compañía se creó, pero no se pudo crear el usuario administrador: ' +
                  (err?.error?.error || 'error desconocido') +
                  '. Vuelve a intentar el usuario desde el detalle de la compañía.'
              );
              this.reload();
            },
          });
        },
        error: (err) => {
          this.saving.set(false);
          this.errorMessage.set(err?.error?.error || 'No se pudo crear la compañía.');
        },
      });
  }

  toggleStatus(c: CompanyWithSubscriptions): void {
    const next: CompanyStatus = c.status === 'suspended' ? 'active' : 'suspended';
    const verb = next === 'suspended' ? 'suspender' : 'reactivar';
    if (!confirm(`¿${verb.charAt(0).toUpperCase() + verb.slice(1)} "${c.name}"?`)) return;

    this.service.updateStatus(c.id, next).subscribe({ next: () => this.reload() });
  }

  viewDetail(c: CompanyWithSubscriptions): void {
    this.router.navigate(['/super-admin/companias', c.id]);
  }

  rowActions(c: CompanyWithSubscriptions): RowAction[] {
    const actions: RowAction[] = [{ label: 'Ver detalle', icon: '🔍', handler: () => this.viewDetail(c) }];

    if (c.status === 'suspended') {
      actions.push({ label: 'Reactivar', icon: '✅', handler: () => this.toggleStatus(c) });
    } else {
      actions.push({ label: 'Suspender', icon: '⛔', handler: () => this.toggleStatus(c), danger: true });
    }

    return actions;
  }
}