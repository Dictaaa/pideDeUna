// src/app/core/services/reservation.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API } from './api.endpoints';
import { Reservation, Review } from '../models/reservation.model';

@Injectable({ providedIn: 'root' })
export class ReservationService {
  constructor(private http: HttpClient) {}

  list(companySlug: string, branchSlug: string, date?: string): Observable<Reservation[]> {
    const base = API.RESERVATIONS.LIST(companySlug, branchSlug);
    const url = date ? `${base}?date=${date}` : base; // date: 'YYYY-MM-DD'
    return this.http.get<Reservation[]>(url);
  }

  create(companySlug: string, branchSlug: string, data: Partial<Reservation>): Observable<Reservation> {
    return this.http.post<Reservation>(API.RESERVATIONS.CREATE(companySlug, branchSlug), data);
  }

  update(companySlug: string, branchSlug: string, id: string, patch: Partial<Reservation>): Observable<Reservation> {
    return this.http.patch<Reservation>(API.RESERVATIONS.UPDATE(companySlug, branchSlug, id), patch);
  }
}

@Injectable({ providedIn: 'root' })
export class ReviewService {
  constructor(private http: HttpClient) {}

  list(companySlug: string, branchSlug: string): Observable<Review[]> {
    return this.http.get<Review[]>(API.REVIEWS.LIST(companySlug, branchSlug));
  }

  createForOrder(
    companySlug: string,
    branchSlug: string,
    orderId: string,
    data: Pick<Review, 'ratingFood' | 'ratingService' | 'ratingExperience' | 'ratingOverall'> & { comment?: string }
  ): Observable<Review> {
    return this.http.post<Review>(API.REVIEWS.CREATE_FOR_ORDER(companySlug, branchSlug, orderId), data);
  }
}