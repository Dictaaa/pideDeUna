export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  city: string | null;
  nit: string | null;
  currency: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
}

export interface ProductMedia {
  id: string;
  mediaType: 'IMAGE' | 'VIDEO';
  url: string;
  thumbnailUrl: string | null;
  altText: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

export interface Ingredient {
  id: string;
  name: string;
}

export interface Allergen {
  id: string;
  name: string;
  iconUrl: string | null;
}

export interface ModifierOption {
  id: string;
  name: string;
  price: string; // NUMERIC llega como string desde Postgres/Sequelize
  isActive: boolean;
  sortOrder: number;
}

export interface ModifierGroup {
  id: string;
  name: string;
  minSelections: number;
  maxSelections: number;
  required: boolean;
  sortOrder: number;
  options: ModifierOption[];
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  price: string;
  compareAtPrice: string | null;
  imageUrl: string | null;
  isAvailable: boolean;
  isFeatured: boolean;
  isRecommended: boolean;
  sortOrder: number;
  media: ProductMedia[];
  ingredients: Ingredient[];
  allergens: Allergen[];
  modifierGroups: ModifierGroup[];
}

export interface MenuCategory {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  products: Product[];
}

export interface PromotionProduct {
  id: string;
  name: string;
  price: string;
  imageUrl: string | null;
}

export interface Promotion {
  id: string;
  name: string;
  description: string | null;
  promoType: 'percentage' | 'fixed_amount' | 'buy_x_get_y' | 'combo';
  percentage: string | null;
  fixedAmount: string | null;
  buyQuantity: number | null;
  getQuantity: number | null;
  imageUrl: string | null;
  products: PromotionProduct[];
}

export interface RestaurantMenuResponse {
  restaurant: Restaurant;
  categories: MenuCategory[];
  promotions: Promotion[];
}

/* ----------------------------------------------------------
   Modelos del carrito — solo viven en el front por ahora.
   Cuando exista el endpoint de pedidos, se mapean 1:1 a
   OrderItem / OrderItemModifier del backend.
   ---------------------------------------------------------- */

export interface SelectedModifier {
  modifierId: string;
  name: string;
  price: number;
}

export interface CartLine {
  lineId: string;
  productId: string;
  name: string;
  imageUrl: string | null;
  unitPrice: number; // precio base + modificadores
  quantity: number;
  notes: string;
  modifiers: SelectedModifier[];
}

export interface CartComboSelection {
  productId: string;
  productName: string;
  quantity: number;
}

export interface CartCombo {
  comboId: string;
  promotionId: string;
  promotionName: string;
  selections: CartComboSelection[];
  totalPrice: number;
  notes: string;
}