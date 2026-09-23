// src/app/core/models/table.model.ts
import { ISODateString, TableSessionStatus, TableStatus, UUID, WaiterCallStatus } from './common.model';

export interface RestaurantTable {
  id: UUID;
  companyId: UUID;
  restaurantId: UUID;
  areaId: UUID | null;
  area?: { id: UUID; name: string } | null;
  tableNumber: string;
  name: string | null;
  capacity: number;
  status: TableStatus;
  sessions?: TableSession[]; // la sesión OPEN actual, si hay (listTables la incluye)
  qrCodes?: TableQrCode[]; // todos, activos e inactivos — filtra por isActive para el QR vigente
  createdAt: ISODateString;
  updatedAt: ISODateString;
  deletedAt: ISODateString | null;
}

export interface TableQrCode {
  id: UUID;
  companyId: UUID;
  restaurantId: UUID;
  tableId: UUID;
  token: UUID; // el QR fijo pegado en la mesa — no cambia
  isActive: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// El token acá SÍ cambia: se genera al abrir la sesión y muere al
// cerrarla — es el que autoriza al cliente a pedir (header X-Session-Token).
export interface TableSession {
  id: UUID;
  companyId: UUID;
  restaurantId: UUID;
  tableId: UUID;
  customerId: UUID | null;
  openedByUserId: UUID | null; // el mesero que la abrió — define de quién es "su" mesa
  guestCount: number | null;
  status: TableSessionStatus;
  token: UUID;
  openedAt: ISODateString;
  closedAt: ISODateString | null;
}

// Respuesta de QR.RESOLVE (GET /:companySlug/:branchSlug/qr/:token)
export interface QrResolveResponse {
  table: RestaurantTable;
  session: TableSession | null;
  canOrder: boolean; // false si el mesero todavía no abrió sesión en esta mesa
}

export interface WaiterCall {
  id: UUID;
  companyId: UUID;
  restaurantId: UUID;
  tableId: UUID;
  table?: { id: UUID; tableNumber: string; name: string | null };
  tableSessionId: UUID | null;
  status: WaiterCallStatus;
  attendedByUserId: UUID | null;
  createdAt: ISODateString;
  attendedAt: ISODateString | null;
}