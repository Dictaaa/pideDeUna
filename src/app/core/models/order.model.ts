// src/app/core/models/order.model.ts
import { ISODateString, KitchenItemStatus, OrderItemStatus, OrderStatus, OrderType, UUID } from './common.model';

export interface OrderItemModifierLine {
  id: UUID;
  companyId: UUID;
  restaurantId: UUID;
  orderItemId: UUID;
  modifierId: UUID | null;
  modifierName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

// Tiempos de cocina de UN ítem (started_at/ready_at/served_at) — esto
// es lo que se había perdido en el rediseño original y se recuperó.
export interface KitchenOrderItem {
  id: UUID;
  companyId: UUID;
  restaurantId: UUID;
  orderItemId: UUID;
  status: KitchenItemStatus;
  startedAt: ISODateString | null;
  readyAt: ISODateString | null;
  servedAt: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface OrderItem {
  id: UUID;
  companyId: UUID;
  restaurantId: UUID;
  orderId: UUID;
  productId: UUID | null;
  productName: string;
  promotionId: UUID | null;
  promotionName: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes: string | null;
  status: OrderItemStatus;
  modifiers?: OrderItemModifierLine[];
  kitchenStatus?: KitchenOrderItem;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// Fila de order_kitchen_assignments — quién tiene reclamado este pedido.
export interface KitchenAssignment {
  id: UUID; // id del usuario (la asociación belongsToMany trae solo id/name del User)
  name: string;
}

export interface OrderStatusHistoryEntry {
  id: UUID;
  companyId: UUID;
  restaurantId: UUID;
  orderId: UUID;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  changedByUserId: UUID | null;
  createdAt: ISODateString;
}

export interface Order {
  id: UUID;
  companyId: UUID;
  restaurantId: UUID;
  orderType: OrderType;
  tableId: UUID | null;
  table?: { id: UUID; tableNumber: string; name: string | null } | null;
  tableSessionId: UUID | null;
  createdByUserId: UUID | null;
  customerId: UUID | null;
  customerName: string | null;
  orderNumber: number;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  tax: number;
  tip: number;
  total: number;
  notes: string | null;
  cancelledAt: ISODateString | null;
  completedAt: ISODateString | null;
  items?: OrderItem[];
  assignedCooks?: KitchenAssignment[]; // solo viene en GET .../kitchen
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// Body de ORDERS.CREATE_PUBLIC (cliente, con X-Session-Token) y de
// ORDERS.CREATE_STAFF (mesero, con JWT) — comparten la forma de items.
export interface CreateOrderItemInput {
  productId: UUID;
  quantity: number;
  notes?: string;
  modifierIds?: UUID[];
}

// Un combo = una promoción (buy_x_get_y / combo) + los productos que
// el cliente eligió para llenarla. Se cobra como UNA sola línea (el
// precio fijo de la promo); los productos elegidos van a $0, solo
// para que cocina sepa qué preparar.
export interface ComboSelectionInput {
  productId: UUID;
  quantity: number;
}

export interface CreateComboInput {
  promotionId: UUID;
  selections: ComboSelectionInput[];
  notes?: string;
}

export interface CreateOrderAsCustomerInput {
  items?: CreateOrderItemInput[];
  combos?: CreateComboInput[];
  notes?: string;
  customerName?: string;
}

export interface CreateOrderAsStaffInput {
  orderType?: OrderType;
  tableSessionId?: UUID; // obligatorio si orderType = DINE_IN
  customerId?: UUID;
  customerName?: string;
  notes?: string;
  items?: CreateOrderItemInput[];
  combos?: CreateComboInput[];
}

// Body de PAYMENTS pero para el flujo de cobro atómico (POST .../orders/:id/charge)
export interface ChargeOrderInput {
  paymentMethod: string;
  transactionReference?: string;
  includeTip: boolean; // el backend calcula el monto según branch/company settings — el front no manda montos
}

// Respuesta JSON de GET .../orders/:id/invoice — para mostrar en pantalla antes de imprimir.
export interface InvoiceItemModifier {
  name: string;
}

export interface InvoiceItem {
  productName: string;
  quantity: number;
  subtotal: number;
  notes: string | null;
  modifiers: InvoiceItemModifier[];
}

export interface Invoice {
  invoiceNumber: string | null;
  paidAt: ISODateString;
  orderNumber: number;
  customerName: string | null;
  restaurant: { name: string; nit: string | null; address: string | null; phone: string | null };
  table: { tableNumber: string } | null;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  taxLabel: string | undefined;
  taxRate: number | undefined;
  tipAmount: number;
  total: number;
  paymentMethod: string;
  transactionReference: string | null;
}