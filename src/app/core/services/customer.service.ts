// src/app/core/services/customer.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API } from './api.endpoints';
import { Customer } from '../models/customer.model';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  constructor(private http: HttpClient) {}

  list(companySlug: string, search?: string): Observable<Customer[]> {
    const url = search ? `${API.CUSTOMERS.LIST(companySlug)}?search=${encodeURIComponent(search)}` : API.CUSTOMERS.LIST(companySlug);
    return this.http.get<Customer[]>(url);
  }

  detail(companySlug: string, id: string): Observable<Customer> {
    return this.http.get<Customer>(API.CUSTOMERS.DETAIL(companySlug, id));
  }

  createOrFind(companySlug: string, data: { name?: string; phone?: string; email?: string }): Observable<Customer> {
    return this.http.post<Customer>(API.CUSTOMERS.CREATE_OR_FIND(companySlug), data);
  }

  update(companySlug: string, id: string, patch: Partial<Customer>): Observable<Customer> {
    return this.http.patch<Customer>(API.CUSTOMERS.UPDATE(companySlug, id), patch);
  }
}