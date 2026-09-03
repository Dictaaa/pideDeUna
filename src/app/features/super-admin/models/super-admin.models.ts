export interface RestaurantListItem {
  id: string;
  name: string;
  slug: string;
  status: string; // trial | active | suspended | cancelled
  city: string | null;
  createdAt: string;
  plan: { id: string; name: string; code: string } | null;
  subscriptionStatus: string | null;
  usersCount: number;
}

export interface RestaurantDetailUser {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
  roles: { id: string; code: string; name: string }[];
}

export interface RestaurantDetail {
  restaurant: {
    id: string;
    name: string;
    slug: string;
    status: string;
    city: string | null;
    createdAt: string;
  };
  subscription: {
    id: string;
    status: string;
    trialEndsAt: string | null;
    expiresAt: string | null;
    plan: { id: string; name: string; code: string; priceMonthly: string };
  } | null;
  users: RestaurantDetailUser[];
  usage: {
    categories: number;
    products: number;
    tables: number;
    users: number;
    photos: number;
    videos: number;
  };
}

export interface CreateRestaurantPayload {
  restaurantName: string;
  slug: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  planId?: string;
  status?: string;
}