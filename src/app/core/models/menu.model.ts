// src/app/core/models/menu.model.ts
import { ISODateString, MediaType, UUID } from './common.model';

export interface MenuCategory {
  id: UUID;
  companyId: UUID;
  restaurantId: UUID | null; // NULL = disponible en todas las sucursales
  name: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  deletedAt: ISODateString | null;
}

export interface ProductMedia {
  id: UUID;
  companyId: UUID;
  productId: UUID;
  mediaType: MediaType;
  url: string;
  thumbnailUrl: string | null;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
  sizeBytes: number;
  createdAt: ISODateString;
}

export interface Ingredient {
  id: UUID;
  companyId: UUID;
  name: string;
  createdAt: ISODateString;
}

export interface Allergen {
  id: UUID;
  name: string;
  iconUrl: string | null;
  createdAt: ISODateString;
}

export interface ModifierGroup {
  id: UUID;
  companyId: UUID;
  name: string;
  options: string;
  minSelections: number;
  maxSelections: number;
  required: boolean;
  sortOrder: number;
  modifiers?: Modifier[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Modifier {
  id: UUID;
  companyId: UUID;
  modifierGroupId: UUID;
  name: string;
  price: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// Producto BASE (catálogo de compañía) — sin resolver contra ninguna sucursal.
export interface Product {
  id: UUID;
  companyId: UUID;
  restaurantId: UUID | null; // NULL = disponible en todas las sucursales
  categoryId: UUID | null;
  category?: { id: UUID; name: string };
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  price: number;
  compareAtPrice: number | null;
  costPrice: number | null;
  sku: string | null;
  imageUrl: string | null;
  isAvailable: boolean;
  isFeatured: boolean;
  isRecommended: boolean;
  sortOrder: number;
  preparationTimeMinutes: number | null;
  media?: ProductMedia[];
  ingredients?: Ingredient[];
  allergens?: Allergen[];
  modifierGroups?: ModifierGroup[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
  deletedAt: ISODateString | null;
}

// Lo que devuelve un producto override (precio/disponibilidad propios
// de UNA sucursal) tal cual sale de la tabla.
export interface RestaurantProductOverride {
  id: UUID;
  companyId: UUID;
  restaurantId: UUID;
  productId: UUID;
  priceOverride: number | null;
  isAvailableOverride: boolean | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// Producto tal como lo devuelve el endpoint DE SUCURSAL
// (BRANCH_PRODUCTS.LIST/DETAIL): ya trae los "effective*" resueltos.
export interface EffectiveProduct extends Product {
  effectivePrice: number;
  effectiveIsAvailable: boolean;
}