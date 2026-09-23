import { ISODateString, UUID } from './common.model';

export interface AuditLog {
  id: UUID;
  companyId: UUID | null;
  restaurantId: UUID | null;
  userId: UUID | null;
  user?: { id: UUID; name: string; email: string };
  action: string; // ej. 'user.create', 'order.cancel', 'payment.refund', 'product.price_change'
  entityType: string; // ej. 'User', 'Order', 'Payment', 'Product'
  entityId: UUID | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: ISODateString;
}