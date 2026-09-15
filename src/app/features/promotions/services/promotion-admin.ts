import { Injectable, inject } from '@angular/core';
import { Api } from '../../../core/services/api';
import { API } from '../../../core/services/api.endpoints';
import { AdminPromotion, PromotionFormValue } from '../models/promotion.models';

@Injectable({ providedIn: 'root' })
export class PromotionAdmin {
  private api = inject(Api);

  list(slug: string) {
    return this.api.get<AdminPromotion[]>(API.PROMOTIONS.LIST(slug));
  }

  /** Crea el combo y de una vez le asigna los productos que aplican. */
  create(slug: string, value: PromotionFormValue, productIds: string[]) {
    return this.api.post<AdminPromotion>(API.PROMOTIONS.CREATE(slug), {
      ...value,
      promoType: 'combo',
      productIds,
    });
  }

  update(slug: string, id: string, value: Partial<PromotionFormValue>) {
    return this.api.patch<AdminPromotion>(API.PROMOTIONS.BY_ID(slug, id), value);
  }

  setProducts(slug: string, id: string, productIds: string[]) {
    return this.api.put<AdminPromotion['products']>(API.PROMOTIONS.SET_PRODUCTS(slug, id), { productIds });
  }

  uploadImage(slug: string, id: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.post<AdminPromotion>(API.PROMOTIONS.UPLOAD_IMAGE(slug, id), formData);
  }

  /** El backend no borra promociones, las desactiva (por si ya se usaron en pedidos). */
  deactivate(slug: string, id: string) {
    return this.api.delete<AdminPromotion>(API.PROMOTIONS.BY_ID(slug, id));
  }
}