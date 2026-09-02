import { Injectable, inject } from '@angular/core';
import { Api } from '../../../core/services/api';
import { API } from '../../../core/services/api.endpoints';
import { AdminArea, AreaFormValue } from '../models/area.models';

@Injectable({ providedIn: 'root' })
export class AreaAdmin {
  private api = inject(Api);

  list(slug: string) {
    return this.api.get<AdminArea[]>(API.AREAS.LIST(slug));
  }
  create(slug: string, value: Omit<AreaFormValue, 'status'>) {
    return this.api.post<AdminArea>(API.AREAS.CREATE(slug), value);
  }
  update(slug: string, id: string, value: Partial<AreaFormValue>) {
    return this.api.patch<AdminArea>(API.AREAS.BY_ID(slug, id), value);
  }
  remove(slug: string, id: string) {
    return this.api.delete<void>(API.AREAS.BY_ID(slug, id));
  }
}