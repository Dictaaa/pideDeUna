export interface AdminCategory {
  id: string;
  restaurantId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface CategoryFormValue {
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
}
