import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PlanAdmin } from '../../../plan/services/plan-admin';
import { PlanInfo } from '../../../plan/models/plan.models';
import { Skeleton } from '../../../../shared/components/skeleton/skeleton';

interface FeatureBlock {
  icon: string;
  title: string;
  description: string;
}

const FEATURES: FeatureBlock[] = [
  {
    icon: '📱',
    title: 'Menú digital por QR',
    description: 'Tu cliente escanea el código de la mesa y ve el menú completo — fotos, video, ingredientes y alérgenos incluidos.',
  },
  {
    icon: '🧾',
    title: 'Pedidos en tiempo real',
    description: 'La mesera arma el pedido desde su celular y cocina lo ve aparecer al instante, con un solo botón para avanzarlo.',
  },
  {
    icon: '👥',
    title: 'Un panel por rol',
    description: 'Cada quien ve solo lo suyo — mesera, cocina y administrador tienen su propia pantalla, sin estorbarse.',
  },
  {
    icon: '📊',
    title: 'Estadísticas reales',
    description: 'Cuántos pedidos, cuánto vendiste, qué se vende más — por día, semana, mes o año.',
  },
];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, DecimalPipe, Skeleton],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private planService = inject(PlanAdmin);

  features = FEATURES;
  loadingPlans = signal(true);
  plans = signal<PlanInfo[]>([]);

  constructor() {
    this.planService.listPlans().subscribe({
      next: (plans) => {
        this.plans.set(plans);
        this.loadingPlans.set(false);
      },
      error: () => this.loadingPlans.set(false),
    });
  }
}