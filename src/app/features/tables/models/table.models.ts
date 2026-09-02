export interface TableQrCode {
  id: string;
  token: string;
  isActive: boolean;
}

export interface AdminArea {
  id: string;
  name: string;
}

export interface AdminTable {
  id: string;
  tableNumber: string;
  name: string | null;
  capacity: number;
  status: string;
  areaId: string | null;
  area?: AdminArea | null;
  qrCodes: TableQrCode[];
}

export interface TableFormValue {
  tableNumber: string;
  name: string;
  areaId: string;
  capacity: number;
  status: string;
}

export const TABLE_STATUSES = [
  'AVAILABLE',
  'OCCUPIED',
  'WAITING_ORDER',
  'ORDERING',
  'WAITING_PAYMENT',
  'CLEANING',
  'DISABLED',
] as const;
