// src/app/core/services/user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API } from './api.endpoints';
import { RoleCode } from '../models/common.model';
import { User, UserRole } from '../models/user.model';

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  roles: { roleCode: RoleCode; restaurantId?: string | null }[];
}

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient) {}

  list(companySlug: string): Observable<User[]> {
    return this.http.get<User[]>(API.USERS.LIST(companySlug));
  }

  create(companySlug: string, data: CreateUserInput): Observable<User> {
    return this.http.post<User>(API.USERS.CREATE(companySlug), data);
  }

  update(companySlug: string, userId: string, patch: Partial<Pick<User, 'name' | 'phone' | 'status'>>): Observable<User> {
    return this.http.patch<User>(API.USERS.UPDATE(companySlug, userId), patch);
  }

  remove(companySlug: string, userId: string): Observable<void> {
    return this.http.delete<void>(API.USERS.REMOVE(companySlug, userId));
  }

  addRole(companySlug: string, userId: string, roleCode: RoleCode, restaurantId?: string | null): Observable<UserRole> {
    return this.http.post<UserRole>(API.USERS.ADD_ROLE(companySlug, userId), { roleCode, restaurantId });
  }

  removeRole(companySlug: string, userId: string, userRoleId: string): Observable<void> {
    return this.http.delete<void>(API.USERS.REMOVE_ROLE(companySlug, userId, userRoleId));
  }

  /** Admin resetea la contraseña de cualquier usuario (no pide la actual). */
  setPassword(companySlug: string, userId: string, newPassword: string): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(API.USERS.SET_PASSWORD(companySlug, userId), { newPassword });
  }
}