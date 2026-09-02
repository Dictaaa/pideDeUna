export interface AdminRole {
  id: string;
  code: string;
  name: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  lastLoginAt: string | null;
  roles: AdminRole[];
}

export interface UserFormValue {
  name: string;
  email: string;
  phone: string;
  status: string;
  password: string; // vacío en edición = no cambiar la contraseña
  roleIds: string[];
}

export const USER_STATUSES = ['active', 'inactive', 'suspended'] as const;
