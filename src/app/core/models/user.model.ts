// src/app/core/models/user.model.ts
import { ISODateString, RoleCode, UUID, UserStatus } from './common.model';

export interface Role {
  id: UUID;
  code: RoleCode;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: ISODateString;
}

export interface Permission {
  id: UUID;
  code: string;
  name: string;
  description: string | null;
  createdAt: ISODateString;
}

// user_roles: NULL en restaurantId = acceso a TODA la compañía
// (dueño/gerente regional); con valor = solo esa sucursal.
export interface UserRole {
  id: UUID;
  userId: UUID;
  roleId: UUID;
  role?: Role;
  restaurantId: UUID | null;
  restaurant?: { id: UUID; slug: string; name: string } | null;
  createdAt: ISODateString;
}

export interface User {
  id: UUID;
  companyId: UUID | null; // NULL = SUPER_ADMIN
  name: string;
  email: string;
  phone: string | null;
  status: UserStatus;
  lastLoginAt: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  deletedAt: ISODateString | null;
  userRoles?: UserRole[];
}