// src/app/core/models/common.model.ts
//
// Tipos compartidos por todo el resto de modelos.

export type UUID = string;
export type ISODateString = string; // lo que llega del backend en JSON (TIMESTAMPTZ serializado)

export type FontFamily = 'inter' | 'fraunces' | 'poppins' | 'roboto-mono';
export type CompanyStatus = 'trial' | 'active' | 'suspended' | 'cancelled';
export type RestaurantStatus = 'trial' | 'active' | 'suspended' | 'cancelled';
export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired';
export type UserStatus = 'active' | 'inactive' | 'suspended';
export type TableStatus =
  | 'AVAILABLE'
  | 'OCCUPIED'
  | 'WAITING_ORDER'
  | 'ORDERING'
  | 'WAITING_PAYMENT'
  | 'CLEANING'
  | 'DISABLED';
export type TableSessionStatus = 'OPEN' | 'CLOSED';
export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'SERVED'
  | 'COMPLETED'
  | 'CANCELLED';
export type OrderItemStatus = 'PENDING' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';
export type KitchenItemStatus = 'PENDING' | 'IN_PROGRESS' | 'READY' | 'SERVED';
export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'WOMPI' | 'EPAYCO' | 'OTHER';
export type PaymentStatus = 'APPROVED' | 'DECLINED' | 'REFUNDED' | 'PENDING';
export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
export type WaiterCallStatus = 'PENDING' | 'ATTENDED' | 'CANCELLED';
export type PromoType = 'percentage' | 'fixed_amount' | 'buy_x_get_y' | 'combo';
export type MediaType = 'IMAGE' | 'VIDEO';

// Códigos de rol tal como los siembra el SQL — no son un enum de la
// base (roles.code es VARCHAR libre), pero en la práctica solo estos
// 5 existen hoy.
export type RoleCode = 'SUPER_ADMIN' | 'RESTAURANT_ADMIN' | 'WAITER' | 'KITCHEN' | 'CASHIER';