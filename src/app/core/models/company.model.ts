// src/app/core/models/company.model.ts
import {
  CompanyStatus, FontFamily, ISODateString, SubscriptionStatus, UUID,
} from './common.model';

export interface Company {
  id: UUID;
  name: string;
  slug: string;
  nit: string | null;
  status: CompanyStatus;
  logoUrl: string | null;
  logoSizeBytes: number;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: FontFamily;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface CompanySettings {
  companyId: UUID;
  taxLabel: string;
  taxRate: number;
  tipRate: number;
  allowTips: boolean;
  storageUsedBytes: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Plan {
  id: UUID;
  code: string;
  name: string;
  description: string | null;
  priceMonthly: number;
  maxTables: number | null;
  maxUsers: number | null;
  maxProducts: number | null;
  maxPhotos: number | null; // ya no se usa (ver storageQuotaMb), queda por compatibilidad
  maxVideos: number | null; // ídem
  maxOrdersMonthly: number | null;
  maxBranches: number | null;
  storageQuotaMb: number;
  isActive: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Subscription {
  id: UUID;
  companyId: UUID;
  planId: UUID;
  plan?: Plan;
  status: SubscriptionStatus;
  startedAt: ISODateString;
  expiresAt: ISODateString | null;
  trialEndsAt: ISODateString | null;
  cancelledAt: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface StorageUsage {
  usedMb: number;
  quotaMb: number;
  remainingMb: number;
}

export interface UsageItem {
  used: number;
  limit: number | null; // null = sin límite
}

export interface CompanyUsage {
  plan: {
    id: UUID;
    code: string;
    name: string;
    priceMonthly: number;
    maxTables: number | null;
    maxUsers: number | null;
    maxProducts: number | null;
    maxBranches: number | null;
    maxOrdersMonthly: number | null;
    storageQuotaMb: number;
  };
  subscription: {
    id: UUID;
    status: SubscriptionStatus;
    startedAt: ISODateString;
    expiresAt: ISODateString | null;
    trialEndsAt: ISODateString | null;
  };
  usage: {
    products: UsageItem;
    tables: UsageItem;
    users: UsageItem;
    branches: UsageItem;
    ordersMonthly: UsageItem;
    storageMb: UsageItem;
  };
}

export interface PublicCompanyInfo {
  id: UUID;
  slug: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: FontFamily;
  restaurants: {
    id: UUID;
    slug: string;
    name: string;
    address: string | null;
    city: string | null;
    coverUrl: string | null;
    isDefault: boolean;
  }[];
}