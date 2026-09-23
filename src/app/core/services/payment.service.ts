// src/app/core/services/payment.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API } from './api.endpoints';
import { CreatePaymentInput, Payment } from '../models/payment.model';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  constructor(private http: HttpClient) {}

  create(companySlug: string, branchSlug: string, orderId: string, data: CreatePaymentInput): Observable<Payment> {
    return this.http.post<Payment>(API.PAYMENTS.CREATE(companySlug, branchSlug, orderId), data);
  }

  listByOrder(companySlug: string, branchSlug: string, orderId: string): Observable<Payment[]> {
    return this.http.get<Payment[]>(API.PAYMENTS.LIST_BY_ORDER(companySlug, branchSlug, orderId));
  }

  refund(companySlug: string, branchSlug: string, id: string): Observable<Payment> {
    return this.http.patch<Payment>(API.PAYMENTS.REFUND(companySlug, branchSlug, id), {});
  }

  /** Devuelve el PDF de la factura como Blob — úsalo con URL.createObjectURL() para abrirlo/imprimirlo. */
  getInvoicePdf(companySlug: string, branchSlug: string, id: string): Observable<Blob> {
    return this.http.get(API.PAYMENTS.INVOICE_PDF(companySlug, branchSlug, id), { responseType: 'blob' });
  }
}