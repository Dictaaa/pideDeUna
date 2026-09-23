import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { ReportService, StatsPeriod, StatsSummary, StatsTimeseriesPoint, StatsTopProduct } from '../../../../core/services/report.service';
import { Skeleton } from '../../../../shared/components/skeleton/skeleton';

const PERIOD_LABELS: Record<StatsPeriod, string> = {
  today: 'Hoy',
  week: 'Esta semana',
  month: 'Este mes',
  year: 'Este año',
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [Skeleton],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  private reportService = inject(ReportService);

  // Con paramsInheritanceStrategy: 'always' (app.config.ts), companySlug
  // llega heredado del padre sin tener que subir con route.parent.
  companySlug = this.route.snapshot.paramMap.get('companySlug')!;
  branchSlug = this.route.snapshot.paramMap.get('branchSlug')!;

  userName = this.auth.me()?.user.name ?? '';

  periods: StatsPeriod[] = ['today', 'week', 'month', 'year'];
  periodLabel = (p: StatsPeriod) => PERIOD_LABELS[p];
  selectedPeriod = signal<StatsPeriod>('month');

  loading = signal(true);
  summary = signal<StatsSummary | null>(null);
  timeseries = signal<StatsTimeseriesPoint[]>([]);
  topProducts = signal<StatsTopProduct[]>([]);

  // Año: barras por mes. Cualquier otro período: barras por día.
  groupBy = computed<'day' | 'month'>(() => (this.selectedPeriod() === 'year' ? 'month' : 'day'));

  maxRevenue = computed(() => Math.max(1, ...this.timeseries().map((p) => p.revenue)));

  constructor() {
    this.reload();
  }

  selectPeriod(period: StatsPeriod): void {
    this.selectedPeriod.set(period);
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    const period = this.selectedPeriod();

    forkJoin({
      summary: this.reportService.getSummary(this.companySlug, this.branchSlug, period),
      timeseries: this.reportService.getTimeseries(this.companySlug, this.branchSlug, this.groupBy(), period),
      topProducts: this.reportService.getTopProducts(this.companySlug, this.branchSlug, period, 5),
    }).subscribe({
      next: (res) => {
        this.summary.set(res.summary);
        this.timeseries.set(res.timeseries);
        this.topProducts.set(res.topProducts);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  barHeightPct(point: StatsTimeseriesPoint): number {
    return Math.max(4, Math.round((point.revenue / this.maxRevenue()) * 100));
  }

  bucketLabel(bucket: string): string {
    const date = new Date(bucket);
    if (this.groupBy() === 'month') {
      return date.toLocaleDateString('es-CO', { month: 'short' });
    }
    return date.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' });
  }

  money(n: number): string {
    return '$' + Math.round(n).toLocaleString('es-CO');
  }
}