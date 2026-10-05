import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CompanyService } from '../../../../core/services/company.service';
import { PublicCompanyInfo } from '../../../../core/models/company.model';

@Component({
  imports: [RouterLink],
  selector: 'app-branch-picker',
  styleUrl: './branch-picker.scss',
  templateUrl: './branch-picker.html',
})
export class BranchPicker {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private companyService = inject(CompanyService);

  companySlug = this.route.snapshot.paramMap.get('companySlug')!;

  loading = signal(true);
  company = signal<PublicCompanyInfo | null>(null);
  loadError = signal<string | null>(null);

  // Solo tiene sentido con más de una sucursal — con una sola, los
  // botones ya apuntan directo a ella, no hay nada que "desplegar".
  showingLocations = signal(false);

  constructor() {
    this.companyService.getPublicInfo(this.companySlug).subscribe({
      next: (c) => {
        this.company.set(c);
        this.loading.set(false);
        document.documentElement.style.setProperty('--primary', c.primaryColor);
        document.documentElement.style.setProperty('--secondary', c.secondaryColor);
      },
      error: () => {
        this.loadError.set('No pudimos cargar esta página.');
        this.loading.set(false);
      },
    });
  }

  toggleLocations(): void {
    this.showingLocations.update((v) => !v);
  }

  hasSocialLinks(c: PublicCompanyInfo): boolean {
    return !!(c.instagramUrl || c.facebookUrl || c.whatsappNumber || c.tiktokUrl);
  }

  /** whatsappNumber se guarda como número plano — el link necesito armarlo acá. */
  whatsappLink(number: string): string {
    const digits = number.replace(/\D/g, '');
    return `https://wa.me/${digits}`;
  }

    onVideoLoaded(event: Event): void {
    const video = event.target as HTMLVideoElement;
    video.muted = true; // por si el navegador no tomó el atributo solo
    video.play().catch(() => {
      // el navegador bloqueó el autoplay (pasa en algunos móviles) — sin
      // un clic del usuario no hay mucho más que hacer al respecto.
    });
  }
}