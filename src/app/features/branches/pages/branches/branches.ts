import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CompanyService } from '../../../../core/services/company.service';
import { Company, CompanyUsage } from '../../../../core/models/company.model';
import { Restaurant } from '../../../../core/models/restaurant.model';
import { TableSkeleton } from '../../../../shared/components/table-skeleton/table-skeleton';

interface BranchFormValue {
  name: string;
  slug: string;
}

const EMPTY_FORM: BranchFormValue = { name: '', slug: '' };

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

@Component({
  selector: 'app-branches',
  standalone: true,
  imports: [FormsModule, TableSkeleton],
  templateUrl: './branches.html',
  styleUrl: './branches.scss',
})
export class Branches {
  private route = inject(ActivatedRoute);
  private companyService = inject(CompanyService);
  private router = inject(Router);

  // Sucursales es de nivel COMPAÑÍA — no necesita branchSlug.
  companySlug = this.route.snapshot.paramMap.get('companySlug')!;

  loading = signal(true);
  company = signal<Company | null>(null);
  restaurants = signal<Restaurant[]>([]);
  // El límite de sucursales del plan ya lo calcula getUsage() (mismo
  // endpoint que usa la pantalla Plan) — no hace falta duplicarlo acá.
  usage = signal<CompanyUsage | null>(null);

  formOpen = signal(false);
  slugTouched = signal(false);
  form = signal<BranchFormValue>({ ...EMPTY_FORM });
  saving = signal(false);
  errorMessage = signal<string | null>(null);

  atLimit = computed(() => {
    const branches = this.usage()?.usage.branches;
    if (!branches || branches.limit === null) return false;
    return branches.used >= branches.limit;
  });

  constructor() {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    // Antes esto era un forkJoin de las 3 — todo o nada. Si getUsage()
    // fallaba (compañías viejas sin suscripción sana, por ejemplo),
    // tapaba a restaurants() aunque esa sí hubiera llegado bien. Ahora
    // van por separado: cada una se pinta con lo que tenga, sin que
    // una tumbe a las otras.
    this.companyService.getDetail(this.companySlug).subscribe({
      next: (company) => this.company.set(company),
    });

    this.companyService.listRestaurants(this.companySlug).subscribe({
      next: (restaurants) => {
        this.restaurants.set(restaurants);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.companyService.getUsage(this.companySlug).subscribe({
      next: (usage) => this.usage.set(usage),
      error: (err) => console.error('[Branches] No se pudo cargar el uso del plan:', err),
    });
  }

  openCreate(): void {
    this.form.set({ ...EMPTY_FORM });
    this.slugTouched.set(false);
    this.errorMessage.set(null);
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
  }

  onNameChange(value: string): void {
    this.form.update((f) => ({ ...f, name: value }));
    if (!this.slugTouched()) {
      this.form.update((f) => ({ ...f, slug: slugify(value) }));
    }
  }

  onSlugChange(value: string): void {
    this.slugTouched.set(true);
    this.form.update((f) => ({ ...f, slug: slugify(value) }));
  }

  save(): void {
    const f = this.form();
    if (!f.name.trim() || !f.slug.trim()) {
      this.errorMessage.set('Nombre y slug son obligatorios.');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);

    this.companyService.createRestaurant(this.companySlug, f).subscribe({
      next: () => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.reload();
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err?.error?.error || 'No se pudo crear la sucursal.');
      },
    });
  }

  goToBranch(branch: Restaurant): void {
    this.router.navigateByUrl(`/admin/${this.companySlug}/${branch.slug}/dashboard`);
  }
}