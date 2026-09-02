import { Injectable, inject } from '@angular/core';
import { Api } from '../../../core/services/api';
import { API } from '../../../core/services/api.endpoints';
import { AdminRole, AdminUser } from '../models/user.models';

@Injectable({ providedIn: 'root' })
export class UserAdmin {
  private api = inject(Api);

  list(slug: string) {
    return this.api.get<AdminUser[]>(API.USERS.LIST(slug));
  }
  create(slug: string, value: { name: string; email: string; phone: string; password: string; roleIds: string[] }) {
    return this.api.post<AdminUser>(API.USERS.CREATE(slug), value);
  }
  update(slug: string, id: string, value: { name: string; phone: string; status: string; password?: string }) {
    return this.api.patch<AdminUser>(API.USERS.BY_ID(slug, id), value);
  }
  remove(slug: string, id: string) {
    return this.api.delete<void>(API.USERS.BY_ID(slug, id));
  }
  setRoles(slug: string, id: string, roleIds: string[]) {
    return this.api.put<AdminRole[]>(API.USERS.SET_ROLES(slug, id), { roleIds });
  }
  /** Catálogo global de roles (SUPER_ADMIN, RESTAURANT_ADMIN, MANAGER, WAITER, KITCHEN, CASHIER). */
  listRoles() {
    return this.api.get<AdminRole[]>(API.ROLES.LIST);
  }
}
