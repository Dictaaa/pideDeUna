import { Injectable, inject } from '@angular/core';
import { Api } from '../../../core/services/api';
import { API } from '../../../core/services/api.endpoints';
import { StatsSummary, StatsTimeseriesPoint, StatsTopProduct } from '../../../core/models/stats.models';

export type StatsPeriod = 'today' | 'week' | 'month' | 'year';

@Injectable({ providedIn: 'root' })
export class StatsAdmin {
  private api = inject(Api);

  getSummary(slug: string, period: StatsPeriod) {
    return this.api.get<StatsSummary>(API.STATS.SUMMARY(slug), { period });
  }
  getTimeseries(slug: string, groupBy: 'day' | 'month', period: StatsPeriod) {
    return this.api.get<StatsTimeseriesPoint[]>(API.STATS.TIMESERIES(slug), { groupBy, period });
  }
  getTopProducts(slug: string, period: StatsPeriod, limit = 5) {
    return this.api.get<StatsTopProduct[]>(API.STATS.TOP_PRODUCTS(slug), { period, limit });
  }
}