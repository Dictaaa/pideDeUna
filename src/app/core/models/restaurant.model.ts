// src/app/core/models/restaurant.model.ts
import { ISODateString, RestaurantStatus, UUID } from './common.model';

// "Restaurant" es conceptualmente SUCURSAL (branch) dentro de una
// compañía — se conserva el nombre por consistencia con el backend.
export interface Restaurant {
  id: UUID;
  companyId: UUID;
  slug: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  coverSizeBytes: number;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  country: string;
  currency: string;
  timezone: string;
  status: RestaurantStatus;
  isActive: boolean;
  isDefault: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface BranchSettings {
  restaurantId: UUID;
  companyId: UUID;
  taxLabel: string | null;
  taxRate: number | null;
  tipRate: number | null;
  allowTips: boolean | null;
  acceptOrders: boolean;
  acceptReservations: boolean;
  allowCustomerOrdering: boolean;
  allowWaiterCalls: boolean;
  allowOnlinePayment: boolean;
  showPrices: boolean;
  showVideos: boolean;
  showAllergens: boolean;
  showIngredients: boolean;
  openingHours: Record<string, unknown> | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface RestaurantArea {
  id: UUID;
  companyId: UUID;
  restaurantId: UUID;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive?: boolean;
  status?: string | null;
  createdAt: ISODateString;
}