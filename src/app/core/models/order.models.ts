export interface OrderItemModifierLine {
  id: string;
  modifierName: string;
  unitPrice: string;
  quantity: number;
}

export interface OrderItemLine {
  id: string;
  productId: string | null;
  productName: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
  notes: string | null;
  status: string;
  modifiers: OrderItemModifierLine[];
}

export interface OrderTableInfo {
  id: string;
  tableNumber: string;
  name: string | null;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'SERVED' | 'COMPLETED' | 'CANCELLED';

export interface Order {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  customerName: string | null;
  subtotal: string;
  total: string;
  createdAt: string;
  table: OrderTableInfo | null;
  items: OrderItemLine[];
}

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
  notes?: string;
  modifierIds?: string[];
}

export interface CreateOrderComboInput {
  promotionId: string;
  selections: { productId: string; quantity: number }[];
}

export interface CreateOrderPayload {
  tableId: string;
  customerName?: string;
  items: CreateOrderItemInput[];
  combos?: CreateOrderComboInput[];
}

export interface InvoiceItemModifier {
  name: string;
  price: string;
}

export interface InvoiceItem {
  productName: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
  notes: string | null;
  modifiers: InvoiceItemModifier[];
}

export interface Invoice {
  restaurant: { name: string; nit: string | null; address: string | null; phone: string | null; city: string | null };
  invoiceNumber: number;
  paidAt: string;
  table: { tableNumber: string; name: string | null } | null;
  orderNumber: number;
  customerName: string | null;
  items: InvoiceItem[];
  subtotal: string;
  taxLabel: string | null;
  taxRate: number;
  taxAmount: string;
  tipAmount: string;
  total: string;
  paymentMethod: string;
  transactionReference: string | null;
}