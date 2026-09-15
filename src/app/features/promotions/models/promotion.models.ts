export interface AdminPromotionProduct {
  id: string;
  name: string;
  price: string;
}

export interface AdminPromotion {
  id: string;
  name: string;
  description: string | null;
  promoType: 'combo' | 'percentage' | 'fixed_amount' | 'buy_x_get_y';
  buyQuantity: number | null;
  fixedAmount: string | null;
  imageUrl: string | null;
  isActive: boolean;
  usesCount: number;
  products: AdminPromotionProduct[];
}

/** Por ahora el admin solo arma promociones tipo combo — "lleva N, paga $X" — que es el pedido explícito. */
export interface PromotionFormValue {
  name: string;
  description: string;
  buyQuantity: number;
  fixedAmount: number;
  isActive: boolean;
}