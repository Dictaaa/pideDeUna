import { Injectable, inject } from '@angular/core';
import { Api } from '../../../core/services/api';
import { API } from '../../../core/services/api.endpoints';
import { AuditLogEntry } from '../models/audit-log.models';

@Injectable({ providedIn: 'root' })
export class AuditLogAdmin {
  private api = inject(Api);

  list(slug: string, entityType?: string, limit = 50) {
    const params: Record<string, string | number> = { limit };
    if (entityType) params['entityType'] = entityType;
    return this.api.get<AuditLogEntry[]>(API.AUDIT_LOG.LIST(slug), params);
  }
}