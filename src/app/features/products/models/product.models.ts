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
  imageUrl: string | null;
  isAvailable: boolean;
  isFeatured: boolean;
  isRecommended: boolean;
  sortOrder: number;
  category?: { id: string; name: string } | null;
  media: AdminProductMedia[];
}

export interface ProductFormValue {
  name: string;
  slug: string;
  categoryId: string;
  description: string;
  price: number;
  isAvailable: boolean;
  isFeatured: boolean;
  isRecommended: boolean;
}
