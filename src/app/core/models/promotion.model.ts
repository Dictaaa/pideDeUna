// src/app/core/models/promotion.model.ts
import { ISODateString, PromoType, UUID } from './common.model';
import { Product } from './menu.model';

export interface Promotion {
  id: UUID;
  companyId: UUID;
  restaurantId: UUID | null; // NULL = aplica en todas las sucursales
  name: string;
  description: string | null;
  promoType: PromoType;
  percentage: number | null;
  fixedAmount: number | null;
  buyQuantity: number | null;
  getQuantity: number | null;
  startDate: string | null; // DATEONLY -> 'YYYY-MM-DD'
  endDate: string | null;
  startTime: string | null; // 'HH:mm:ss'
  endTime: string | null;
  daysOfWeek: number[] | null; // 0=domingo ... 6=sábado
  maxUses: number | null;
  usesCount: number;
  imageUrl: string | null;
  imageSizeBytes: number;
  isActive: boolean;
  products?: Pick<Product, 'id' | 'name' | 'price' | 'imageUrl'>[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface RestaurantPromotionOverride {
  id: UUID;
  companyId: UUID;
  restaurantId: UUID;
  promotionId: UUID;
  percentageOverride: number | null;
  fixedAmountOverride: number | null;
  isAvailableOverride: boolean | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// Promo tal como la devuelve el endpoint DE SUCURSAL — ya trae los
// "effective*" resueltos y products filtrado a lo que sigue existiendo ahí.
export interface EffectivePromotion extends Omit<Promotion, 'products'> {
  effectivePercentage: number | null;
  effectiveFixedAmount: number | null;
  effectiveIsAvailable: boolean;
  products: Pick<Product, 'id' | 'name' | 'price' | 'imageUrl'>[];
}