import { Injectable, inject } from '@angular/core';
import { Api } from '../../../core/services/api';
import { API } from '../../../core/services/api.endpoints';
import { AdminArea, AdminTable, TableFormValue, TableQrCode } from '../models/table.models';

@Injectable({ providedIn: 'root' })
export class TableAdmin {
  private api = inject(Api);

  list(slug: string) {
    return this.api.get<AdminTable[]>(API.TABLES.LIST(slug));
  }
  create(slug: string, value: TableFormValue) {
    return this.api.post<AdminTable>(API.TABLES.CREATE(slug), value);
  }
  update(slug: string, id: string, value: Partial<TableFormValue>) {
    return this.api.patch<AdminTable>(API.TABLES.BY_ID(slug, id), value);
  }
  remove(slug: string, id: string) {
    return this.api.delete<void>(API.TABLES.BY_ID(slug, id));
  }
  regenerateQr(slug: string, id: string) {
    return this.api.post<TableQrCode>(API.TABLES.REGENERATE_QR(slug, id), {});
  }
  listAreas(slug: string) {
    return this.api.get<AdminArea[]>(API.AREAS.LIST(slug));
  }
}
