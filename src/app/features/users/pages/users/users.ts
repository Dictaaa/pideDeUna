import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CreateUserInput, UserService } from '../../../../core/services/user.service';
import { CompanyService } from '../../../../core/services/company.service';
import { RoleService } from '../../../../core/services/catalog.service';
import { Role, User, UserRole } from '../../../../core/models/user.model';
import { Restaurant } from '../../../../core/models/restaurant.model';
import { RoleCode, UserStatus } from '../../../../core/models/common.model';
import { TableSkeleton } from '../../../../shared/components/table-skeleton/table-skeleton';
import { ActionsMenu, RowAction } from '../../../../shared/components/actions-menu/actions-menu/actions-menu';

const USER_STATUSES: UserStatus[] = ['active', 'inactive', 'suspended'];
const STATUS_LABELS: Record<UserStatus, string> = { active: 'Activo', inactive: 'Inactivo', suspended: 'Suspendido' };
const STATUS_BADGE_CLASS: Record<UserStatus, string> = {
  active: 'badge-success',
  inactive: 'badge-neutral',
  suspended: 'badge-danger',
};

interface UserFormValue {
  name: string;
  email: string;
  phone: string;
  status: UserStatus;
  password: string;
}

const EMPTY_FORM: UserFormValue = { name: '', email: '', phone: '', status: 'active', password: '' };

// Un rol siempre va atado a una sucursal (o a toda la compañía, si
// restaurantId es null) — no existe "el rol" suelto, como en el modelo viejo.
interface DraftRoleAssignment {
  roleCode: RoleCode;
  restaurantId: string | null;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [FormsModule, TableSkeleton, ActionsMenu],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users {
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);
  private companyService = inject(CompanyService);
  private roleService = inject(RoleService);

  // Users es de nivel COMPAÑÍA — no necesita branchSlug.
  companySlug = this.route.snapshot.paramMap.get('companySlug')!;
  statuses = USER_STATUSES;
  statusLabel = (s: UserStatus) => STATUS_LABELS[s] ?? s;
  badgeClass = (s: UserStatus) => STATUS_BADGE_CLASS[s] ?? 'badge-neutral';

  loading = signal(true);
  users = signal<User[]>([]);
  roles = signal<Role[]>([]);
  branches = signal<Restaurant[]>([]);

  formOpen = signal(false);
  editingUser = signal<User | null>(null);
  form = signal<UserFormValue>({ ...EMPTY_FORM });
  saving = signal(false);
  errorMessage = signal<string | null>(null);

  // Solo para modo CREAR — se mandan junto con el usuario en una sola
  // llamada. En EDITAR no hay "reemplazar todos los roles" en el
  // backend, así que ahí se agregan/quitan uno por uno contra la API.
  draftRoles = signal<DraftRoleAssignment[]>([]);
  newRoleCode = signal<RoleCode | ''>('');
  newRoleBranchId = signal<string>(''); // '' = toda la compañía

  constructor() {
    this.reload();
    // El SUPER_ADMIN no se asigna desde acá (no pertenece a ninguna compañía).
    this.roleService.list().subscribe({
      next: (roles) => this.roles.set(roles.filter((r) => r.code !== 'SUPER_ADMIN')),
    });
    this.companyService.listRestaurants(this.companySlug).subscribe({
      next: (branches) => this.branches.set(branches),
    });
  }

  reload(): void {
    this.loading.set(true);
    this.userService.list(this.companySlug).subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  branchName(restaurantId: string | null): string {
    if (!restaurantId) return 'Toda la compañía';
    return this.branches().find((b) => b.id === restaurantId)?.name ?? '—';
  }

  roleAssignmentLabel(ur: UserRole): string {
    return `${ur.role?.name ?? ur.roleId} · ${this.branchName(ur.restaurantId)}`;
  }

  openCreate(): void {
    this.editingUser.set(null);
    this.form.set({ ...EMPTY_FORM });
    this.draftRoles.set([]);
    this.newRoleCode.set('');
    this.newRoleBranchId.set('');
    this.errorMessage.set(null);
    this.formOpen.set(true);
  }

  openEdit(user: User): void {
    this.editingUser.set(user);
    this.form.set({
      name: user.name,
      email: user.email,
      phone: user.phone ?? '',
      status: user.status,
      password: '',
    });
    this.newRoleCode.set('');
    this.newRoleBranchId.set('');
    this.errorMessage.set(null);
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
  }

  updateField<K extends keyof UserFormValue>(key: K, value: UserFormValue[K]): void {
    this.form.set({ ...this.form(), [key]: value });
  }

  // ---------------- Roles — modo CREAR (se acumulan localmente) ----------------

  addDraftRole(): void {
    const code = this.newRoleCode();
    if (!code) return;
    const restaurantId = this.newRoleBranchId() || null;

    const already = this.draftRoles().some((r) => r.roleCode === code && r.restaurantId === restaurantId);
    if (already) return;

    this.draftRoles.set([...this.draftRoles(), { roleCode: code, restaurantId }]);
    this.newRoleCode.set('');
    this.newRoleBranchId.set('');
  }

  removeDraftRole(index: number): void {
    this.draftRoles.set(this.draftRoles().filter((_, i) => i !== index));
  }

  // ---------------- Roles — modo EDITAR (uno por uno, contra el backend) ----------------

  addRoleToEditingUser(): void {
    const user = this.editingUser();
    const code = this.newRoleCode();
    if (!user || !code) return;
    const restaurantId = this.newRoleBranchId() || null;

    this.userService.addRole(this.companySlug, user.id, code, restaurantId).subscribe({
      next: () => {
        this.newRoleCode.set('');
        this.newRoleBranchId.set('');
        this.refreshEditingUser(user.id);
      },
      error: (err) => this.errorMessage.set(err?.error?.error || 'No se pudo agregar el rol.'),
    });
  }

  removeRoleFromEditingUser(userRole: UserRole): void {
    const user = this.editingUser();
    if (!user) return;

    this.userService.removeRole(this.companySlug, user.id, userRole.id).subscribe({
      next: () => this.refreshEditingUser(user.id),
      error: (err) => this.errorMessage.set(err?.error?.error || 'No se pudo quitar el rol.'),
    });
  }

  private refreshEditingUser(userId: string): void {
    this.userService.list(this.companySlug).subscribe((users) => {
      this.users.set(users);
      this.editingUser.set(users.find((u) => u.id === userId) ?? null);
    });
  }

  // ---------------- Guardar ----------------

  save(): void {
    const f = this.form();
    const editing = this.editingUser();

    if (!f.name.trim() || (!editing && !f.email.trim())) {
      this.errorMessage.set('Nombre y email son obligatorios.');
      return;
    }
    if (!editing && f.password.length < 8) {
      this.errorMessage.set('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (!editing && this.draftRoles().length === 0) {
      this.errorMessage.set('Asigna al menos un rol.');
      return;
    }
    if (editing && f.password && f.password.length < 8) {
      this.errorMessage.set('Si vas a cambiar la contraseña, debe tener al menos 8 caracteres.');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);

    if (editing) {
      this.userService.update(this.companySlug, editing.id, { name: f.name, phone: f.phone, status: f.status }).subscribe({
        next: () => {
          if (f.password) {
            // Admin resetea la contraseña — endpoint aparte, no pide la actual.
            this.userService.setPassword(this.companySlug, editing.id, f.password).subscribe({
              next: () => this.finishSave(),
              error: () => this.finishSave(), // el usuario ya se guardó; la contraseña se puede reintentar
            });
          } else {
            this.finishSave();
          }
        },
        error: (err) => this.failSave(err),
      });
    } else {
      const payload: CreateUserInput = {
        name: f.name,
        email: f.email,
        password: f.password,
        roles: this.draftRoles(),
      };
      this.userService.create(this.companySlug, payload).subscribe({
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

  private failSave(err: { error?: { error?: string } }): void {
    this.saving.set(false);
    this.errorMessage.set(err?.error?.error || 'No se pudo guardar el usuario.');
  }

  remove(user: User): void {
    if (!confirm(`¿Eliminar a "${user.name}"?`)) return;
    this.userService.remove(this.companySlug, user.id).subscribe({ next: () => this.reload() });
  }

  rowActions(user: User): RowAction[] {
    return [
      { label: 'Editar', icon: '✏️', handler: () => this.openEdit(user) },
      { label: 'Eliminar', icon: '🗑️', handler: () => this.remove(user), danger: true },
    ];
  }
}