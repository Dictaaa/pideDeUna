import { Injectable, inject } from '@angular/core';
import { Api } from '../../../core/services/api';
import { API } from '../../../core/services/api.endpoints';
import { AdminProduct, AdminProductMedia, ProductFormValue } from '../models/product.models';

@Injectable({ providedIn: 'root' })
export class ProductAdmin {
  private api = inject(Api);

  list(slug: string) {
    return this.api.get<AdminProduct[]>(API.PRODUCTS.LIST(slug));
  }
  getOne(slug: string, id: string) {
    return this.api.get<AdminProduct>(API.PRODUCTS.BY_ID(slug, id));
  }
  create(slug: string, value: ProductFormValue) {
    return this.api.post<AdminProduct>(API.PRODUCTS.CREATE(slug), value);
  }
  update(slug: string, id: string, value: Partial<ProductFormValue>) {
    return this.api.patch<AdminProduct>(API.PRODUCTS.BY_ID(slug, id), value);
  }
  remove(slug: string, id: string) {
    return this.api.delete<void>(API.PRODUCTS.BY_ID(slug, id));
  }

  /** Sube una foto o un video — el backend decide cuál es por el mimetype del archivo. */
  uploadMedia(slug: string, productId: string, file: File, isPrimary: boolean) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('isPrimary', String(isPrimary));
    return this.api.post<AdminProductMedia>(API.PRODUCTS.MEDIA_UPLOAD(slug, productId), formData);
  }
  removeMedia(slug: string, productId: string, mediaId: string) {
    return this.api.delete<void>(API.PRODUCTS.MEDIA_DELETE(slug, productId, mediaId));
  }
}
