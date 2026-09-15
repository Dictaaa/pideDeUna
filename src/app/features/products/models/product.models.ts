export interface AdminProductMedia {
  id: string;
  mediaType: 'IMAGE' | 'VIDEO';
  url: string;
  isPrimary: boolean;
}

export interface AdminProduct {
  id: string;
  restaurantId: string;
  categoryId: string | null;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  compareAtPrice: string | null;
  imageUrl: string | null;
  isAvailable: boolean;
  isFeatured: boolean;
  isRecommended: boolean;
  sortOrder: number;
  category?: { id: string; name: string } | null;
  media: AdminProductMedia[];
  modifierGroups: { id: string; name: string }[];
}

export interface ProductFormValue {
  name: string;
  slug: string;
  categoryId: string;
  description: string;
  price: number;
  compareAtPrice: number | null; // precio "antes" — null = sin descuento
  isAvailable: boolean;
  isFeatured: boolean;
  isRecommended: boolean;
}