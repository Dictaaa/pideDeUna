import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PlanService } from '../../../../core/services/super-admin.service';
import { Plan } from '../../../../core/models/company.model';
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

// No hay registro público — el equipo de PideDeUna crea cada
// compañía a mano después de hablar contigo. Todos los "empezar"
// de esta página apuntan acá, no a un formulario de registro.
const WHATSAPP_URL = 'https://wa.me/573154789845';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, DecimalPipe, Skeleton],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private planService = inject(PlanService);

  features = FEATURES;
  whatsappUrl = WHATSAPP_URL;
  loadingPlans = signal(true);
  plans = signal<Plan[]>([]);

  constructor() {
    this.planService.list().subscribe({
      next: (plans) => {
        // Por si acaso el backend no filtra solo: un plan discontinuado
        // no debería aparecer en la vitrina pública.
        this.plans.set(plans.filter((p) => p.isActive));
        this.loadingPlans.set(false);
      },
      error: () => this.loadingPlans.set(false),
    });
  }
}