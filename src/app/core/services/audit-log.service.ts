import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API } from './api.endpoints';
import { AuditLog } from '../models/audit.model';

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  constructor(private http: HttpClient) {}

  list(companySlug: string, filters?: { entityType?: string; entityId?: string; restaurantId?: string }): Observable<AuditLog[]> {
    const base = API.AUDIT_LOGS.LIST(companySlug);
    if (!filters) return this.http.get<AuditLog[]>(base);

    const params = new URLSearchParams();
    if (filters.entityType) params.set('entityType', filters.entityType);
    if (filters.entityId) params.set('entityId', filters.entityId);
    if (filters.restaurantId) params.set('restaurantId', filters.restaurantId);
    const query = params.toString();

    return this.http.get<AuditLog[]>(query ? `${base}?${query}` : base);
  }
}