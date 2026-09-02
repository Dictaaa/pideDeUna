export interface StatsSummary {
  period: string;
  ordersCount: number;
  revenue: number;
  avgTicket: number;
  cancelledCount: number;
}

export interface StatsTimeseriesPoint {
  bucket: string;
  ordersCount: number;
  revenue: number;
}

export interface StatsTopProduct {
  productName: string;
  quantitySold: number;
  revenue: number;
}