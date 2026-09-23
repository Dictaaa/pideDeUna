// src/app/core/services/report.service.ts — solo RESTAURANT_ADMIN/SUPER_ADMIN.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API } from './api.endpoints';

export interface SalesDailyRow {
  companyId: string;
  restaurantId: string;
  salesDate: string;
  ordersCount: number;
  totalSales: number;
  totalTips: number;
}

export interface ProductSalesRow {
  companyId: string;
  restaurantId: string;
  productId: string;
  productName: string;
  unitsSold: number;
  totalRevenue: number;
}

export interface WaiterPerformanceRow {
  companyId: string;
  restaurantId: string;
  waiterId: string;
  waiterName: string;
  ordersTaken: number;
  totalSold: number;
}

export interface TableStatusRow {
  companyId: string;
  restaurantId: string;
  tableId: string;
  tableNumber: string;
  tableStatus: string;
  sessionId: string | null;
  sessionStatus: string | null;
  openedAt: string | null;
}

// ── Dashboard (resumen + gráfico + top productos, con selector de período) ──
export type StatsPeriod = 'today' | 'week' | 'month' | 'year';

export interface StatsSummary {
  ordersCount: number;
  revenue: number;
  avgTicket: number;
  cancelledCount: number;
}

export interface StatsTimeseriesPoint {
  bucket: string; // fecha ISO (día o primer día del mes, según groupBy)
  revenue: number;
}

export interface StatsTopProduct {
  productName: string;
  quantitySold: number;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  constructor(private http: HttpClient) {}

  salesDaily(companySlug: string, branchSlug: string, from?: string, to?: string): Observable<SalesDailyRow[]> {
    const params: string[] = [];
    if (from) params.push(`from=${from}`);
    if (to) params.push(`to=${to}`);
    const url = params.length ? `${API.REPORTS.SALES_DAILY(companySlug, branchSlug)}?${params.join('&')}` : API.REPORTS.SALES_DAILY(companySlug, branchSlug);
    return this.http.get<SalesDailyRow[]>(url);
  }

  productSales(companySlug: string, branchSlug: string): Observable<ProductSalesRow[]> {
    return this.http.get<ProductSalesRow[]>(API.REPORTS.PRODUCT_SALES(companySlug, branchSlug));
  }

  waiterPerformance(companySlug: string, branchSlug: string): Observable<WaiterPerformanceRow[]> {
    return this.http.get<WaiterPerformanceRow[]>(API.REPORTS.WAITER_PERFORMANCE(companySlug, branchSlug));
  }

  tableStatus(companySlug: string, branchSlug: string): Observable<TableStatusRow[]> {
    return this.http.get<TableStatusRow[]>(API.REPORTS.TABLE_STATUS(companySlug, branchSlug));
  }

  getSummary(companySlug: string, branchSlug: string, period: StatsPeriod): Observable<StatsSummary> {
    return this.http.get<StatsSummary>(`${API.REPORTS.SUMMARY(companySlug, branchSlug)}?period=${period}`);
  }

  getTimeseries(
    companySlug: string,
    branchSlug: string,
    groupBy: 'day' | 'month',
    period: StatsPeriod
  ): Observable<StatsTimeseriesPoint[]> {
    return this.http.get<StatsTimeseriesPoint[]>(
      `${API.REPORTS.TIMESERIES(companySlug, branchSlug)}?period=${period}&groupBy=${groupBy}`
    );
  }

  getTopProducts(companySlug: string, branchSlug: string, period: StatsPeriod, limit = 5): Observable<StatsTopProduct[]> {
    return this.http.get<StatsTopProduct[]>(
      `${API.REPORTS.TOP_PRODUCTS(companySlug, branchSlug)}?period=${period}&limit=${limit}`
    );
  }
}