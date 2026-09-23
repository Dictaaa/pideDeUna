// src/app/core/models/payment.model.ts
import { ISODateString, PaymentMethod, PaymentStatus, UUID } from './common.model';

export interface Payment {
  id: UUID;
  companyId: UUID;
  restaurantId: UUID;
  orderId: UUID;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  transactionReference: string | null;
  invoiceNumber: string | null; // formateado "prefijo-número", ya no es un entero puro
  taxAmount: number;
  tipAmount: number;
  paidAt: ISODateString;
  createdAt: ISODateString;
}

export interface Tip {
  id: UUID;
  companyId: UUID;
  restaurantId: UUID;
  orderId: UUID;
  waiterUserId: UUID | null;
  amount: number;
  createdAt: ISODateString;
}

// Body de PAYMENTS.CREATE
export interface CreatePaymentInput {
  amount: number;
  paymentMethod: PaymentMethod;
  transactionReference?: string;
  taxAmount?: number;
  tipAmount?: number;
}