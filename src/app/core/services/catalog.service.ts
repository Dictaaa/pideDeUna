// src/app/core/services/catalog.service.ts — catálogo global de solo lectura.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API } from './api.endpoints';
import { Permission, Role } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class RoleService {
  constructor(private http: HttpClient) {}

  list(): Observable<Role[]> {
    return this.http.get<Role[]>(API.ROLES.LIST());
  }
}

@Injectable({ providedIn: 'root' })
export class PermissionService {
  constructor(private http: HttpClient) {}

  list(): Observable<Permission[]> {
    return this.http.get<Permission[]>(API.PERMISSIONS.LIST());
  }
}