import { Injectable, inject } from '@angular/core';
import { Api } from '../../../core/services/api';
import { API } from '../../../core/services/api.endpoints';
import { AdminCategory, CategoryFormValue } from '../models/category.models';

@Injectable({ providedIn: 'root' })
export class Category {
  private api = inject(Api);

  list(slug: string) {
    return this.api.get<AdminCategory[]>(API.CATEGORIES.LIST(slug));
  }
  create(slug: string, value: CategoryFormValue) {
    return this.api.post<AdminCategory>(API.CATEGORIES.CREATE(slug), value);
  }
  update(slug: string, id: string, value: CategoryFormValue) {
    return this.api.patch<AdminCategory>(API.CATEGORIES.BY_ID(slug, id), value);
  }
  remove(slug: string, id: string) {
    return this.api.delete<void>(API.CATEGORIES.BY_ID(slug, id));
  }
}
