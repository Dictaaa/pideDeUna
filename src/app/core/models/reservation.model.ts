// src/app/core/models/reservation.model.ts
import { ISODateString, ReservationStatus, UUID } from './common.model';

export interface Reservation {
  id: UUID;
  companyId: UUID;
  restaurantId: UUID;
  tableId: UUID | null;
  table?: { id: UUID; tableNumber: string };
  customerId: UUID | null;
  customerName: string | null;
  phone: string | null;
  partySize: number;
  reservationTime: ISODateString;
  status: ReservationStatus;
  notes: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// Las 4 calificaciones — se restauraron completas, no es una sola nota general.
export interface Review {
  id: UUID;
  companyId: UUID;
  restaurantId: UUID;
  customerId: UUID | null;
  orderId: UUID | null;
  ratingFood: number;
  ratingService: number;
  ratingExperience: number;
  ratingOverall: number;
  comment: string | null;
  createdAt: ISODateString;
}