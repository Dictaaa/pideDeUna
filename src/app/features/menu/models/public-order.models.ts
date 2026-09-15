export interface PublicSessionTable {
  id: string;
  tableNumber: string;
  name: string | null;
}

export interface SessionInfo {
  canOrder: boolean;
  table?: PublicSessionTable;
}

export interface PublicOrderItemInput {
  productId: string;
  quantity: number;
  notes?: string;
  modifierIds?: string[];
}

export interface PublicOrderComboInput {
  promotionId: string;
  selections: { productId: string; quantity: number }[];
  notes?: string;
}

export interface PublicOrderResult {
  orderId: string;
  orderNumber: number;
  total: string;
}

export interface PublicOrderStatusItem {
  productName: string;
  quantity: number;
  notes: string | null;
}

export interface PublicOrderStatus {
  orderNumber: number;
  status: string;
  statusLabel: string;
  total: string;
  items: PublicOrderStatusItem[];
}