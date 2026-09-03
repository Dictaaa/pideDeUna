import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { UserAdmin } from '../../services/user-admin';
import { AdminRole, AdminUser, USER_STATUSES, UserFormValue } from '../../models/user.models';
import { TableSkeleton } from '../../../../shared/components/table-skeleton/table-skeleton';
import { ActionsMenu, RowAction } from '../../../../shared/components/actions-menu/actions-menu/actions-menu';

const EMPTY_FORM: UserFormValue = { name: '', email: '', phone: '', status: 'active', password: '', roleIds: [] };

const STATUS_LABELS: Record<string, string> = { active: 'Activo', inactive: 'Inactivo', suspended: 'Suspendido' };
const STATUS_BADGE_CLASS: Record<string, string> = {
  active: 'badge-success',
  inactive: 'badge-neutral',
  suspended: 'badge-danger',
};

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [FormsModule, TableSkeleton, ActionsMenu],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users {
  private route = inject(ActivatedRoute);
  private userService = inject(UserAdmin);

  slug = this.route.parent!.snapshot.paramMap.get('slug')!;
  statuses = USER_STATUSES;
  statusLabel = (s: string) => STATUS_LABELS[s] ?? s;
  badgeClass = (s: string) => STATUS_BADGE_CLASS[s] ?? 'badge-neutral';

  loading = signal(true);
  users = signal<AdminUser[]>([]);
  roles = signal<AdminRole[]>([]);

  formOpen = signal(false);
  editingId = signal<string | null>(null);
  form = signal<UserFormValue>({ ...EMPTY_FORM });
  saving = signal(false);
  errorMessage = signal<string | null>(null);

  constructor() {
    this.reload();
    this.userService.listRoles().subscribe({
      // El SUPER_ADMIN no se asigna desde aquí (no pertenece a un restaurante).
      next: (roles) => this.roles.set(roles.filter((r) => r.code !== 'SUPER_ADMIN')),
    });
  }

  reload(): void {
    this.loading.set(true);
    this.userService.list(this.slug).subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.set({ ...EMPTY_FORM });
    this.errorMessage.set(null);
    this.formOpen.set(true);
  }

  openEdit(user: AdminUser): void {
    this.editingId.set(user.id);
    this.form.set({
      name: user.name,
      email: user.email,
      phone: user.phone ?? '',
      status: user.status,
      password: '',
      roleIds: user.roles.map((r) => r.id),
    });
    this.errorMessage.set(null);
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
  }

  updateField<K extends keyof UserFormValue>(key: K, value: UserFormValue[K]): void {
    this.form.set({ ...this.form(), [key]: value });
  }

  toggleRole(roleId: string, checked: boolean): void {
    const current = this.form().roleIds;
    const next = checked ? [...current, roleId] : current.filter((id) => id !== roleId);
    this.updateField('roleIds', next);
  }

  save(): void {
    const f = this.form();
    const isEditing = !!this.editingId();

    if (!f.name.trim() || (!isEditing && !f.email.trim())) {
      this.errorMessage.set('Nombre y email son obligatorios.');
      return;
    }
    if (!isEditing && f.password.length < 8) {
      this.errorMessage.set('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (isEditing && f.password && f.password.length < 8) {
      this.errorMessage.set('Si vas a cambiar la contraseña, debe tener al menos 8 caracteres.');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);

    if (isEditing) {
      const id = this.editingId()!;
      const payload: any = { name: f.name, phone: f.phone, status: f.status };
      if (f.password) payload.password = f.password;

      this.userService.update(this.slug, id, payload).subscribe({
        next: () => {
          this.userService.setRoles(this.slug, id, f.roleIds).subscribe({
            next: () => this.finishSave(),
            error: () => this.finishSave(), // el usuario ya se guardó; los roles se pueden reintentar
          });
        },
        error: (err) => this.failSave(err),
      });
    } else {
      this.userService.create(this.slug, f).subscribe({
        next: () => this.finishSave(),
        error: (err) => this.failSave(err),
      });
    }
  }

  private finishSave(): void {
    this.saving.set(false);
    this.formOpen.set(false);
    this.reload();
  }

  private failSave(err: any): void {
    this.saving.set(false);
    this.errorMessage.set(err?.error?.error || 'No se pudo guardar el usuario.');
  }

  remove(user: AdminUser): void {
    if (!confirm(`¿Eliminar a "${user.name}"?`)) return;
    this.userService.remove(this.slug, user.id).subscribe({ next: () => this.reload() });
  }

    rowActions(user: AdminUser): RowAction[] {
    return [
      { label: 'Editar', icon: '✏️', handler: () => this.openEdit(user) },
      { label: 'Eliminar', icon: '🗑️', handler: () => this.remove(user), danger: true },
    ];
  }
}
