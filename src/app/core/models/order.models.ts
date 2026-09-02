export interface OrderItemLine {
  id: string;
  productId: string | null;
  productName: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
  status: string;
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
}

export interface CreateOrderPayload {
  tableId: string;
  customerName?: string;
  items: CreateOrderItemInput[];
}