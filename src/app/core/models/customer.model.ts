// src/app/core/models/customer.model.ts
import { ISODateString, UUID } from './common.model';

export interface Customer {
  id: UUID;
  companyId: UUID;
  name: string | null;
  phone: string | null;
  email: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}