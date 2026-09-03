export interface PlanInfo {
  id: string;
  code: string;
  name: string;
  description: string | null;
  priceMonthly: string;
  maxTables: number | null;
  maxUsers: number | null;
  maxProducts: number | null;
  maxPhotos: number | null;
  maxVideos: number | null;
  maxCategories: number | null;
  isActive: boolean; 
}

export interface UsageItem {
  used: number;
  limit: number | null; // null = sin límite (plan Premium)
}

export interface SubscriptionUsage {
  subscription: { status: string; expiresAt: string | null; trialEndsAt: string | null };
  plan: PlanInfo;
  usage: {
    categories: UsageItem;
    products: UsageItem;
    tables: UsageItem;
    users: UsageItem;
    photos: UsageItem;
    videos: UsageItem;
    
  };
}

export interface PlanFormValue {
  code: string;
  name: string;
  description: string;
  priceMonthly: number;
  maxTables: number | null;
  maxUsers: number | null;
  maxProducts: number | null;
  maxPhotos: number | null;
  maxVideos: number | null;
  maxCategories: number | null;
  isActive: boolean; 
}