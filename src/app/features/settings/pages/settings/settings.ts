import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CompanyService } from '../../../../core/services/company.service';
import { Company, CompanySettings } from '../../../../core/models/company.model';
import { Skeleton } from '../../../../shared/components/skeleton/skeleton';
import { applyMenuFont, MENU_FONT_OPTIONS } from '../../../../shared/utils/menu-fonts';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, Skeleton],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings {
  private route = inject(ActivatedRoute);
  private companyService = inject(CompanyService);

  // Configuración es de nivel COMPAÑÍA — no necesita branchSlug. Los
  // toggles operativos (aceptar pedidos, llamar mesero, etc.) viven en
  // branch_settings, no acá — necesitan su propia pantalla a nivel
  // sucursal, que no está construida todavía.
  companySlug = this.route.snapshot.paramMap.get('companySlug')!;
  fontOptions = MENU_FONT_OPTIONS;

  loading = signal(true);
  settings = signal<CompanySettings | null>(null);
  company = signal<Company | null>(null);

  savingSettings = signal(false);
  savingBranding = signal(false);
  settingsSaved = signal(false);
  brandingSaved = signal(false);
  errorMessage = signal<string | null>(null);

  primaryColor = signal('#FF8A1E');
  secondaryColor = signal('#FFC02E');
  fontFamily = signal('inter');

  nit = signal('');
  savingNit = signal(false);
  nitSaved = signal(false);

  uploadingLogo = signal(false);
  logoError = signal<string | null>(null);

  constructor() {
    this.companyService.getSettings(this.companySlug).subscribe({
      next: (s) => {
        this.settings.set(s);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.companyService.getDetail(this.companySlug).subscribe({
      next: (c) => {
        this.company.set(c);
        this.primaryColor.set(c.primaryColor);
        this.secondaryColor.set(c.secondaryColor);
        this.fontFamily.set(c.fontFamily);
        this.nit.set(c.nit ?? '');
      },
    });
  }

  /** Para los campos de facturación (taxLabel, taxRate, tipRate, allowTips). */
  setSettingField<K extends keyof CompanySettings>(key: K, value: CompanySettings[K]): void {
    const current = this.settings();
    if (!current) return;
    this.settings.set({ ...current, [key]: value });
  }

  saveNit(): void {
    this.savingNit.set(true);
    this.errorMessage.set(null);

    this.companyService.update(this.companySlug, { nit: this.nit().trim() }).subscribe({
      next: (c) => {
        this.company.set(c);
        this.savingNit.set(false);
        this.nitSaved.set(true);
        setTimeout(() => this.nitSaved.set(false), 1800);
      },
      error: (err) => {
        this.savingNit.set(false);
        this.errorMessage.set(err?.error?.error || 'No se pudo guardar el NIT.');
      },
    });
  }

  saveSettings(): void {
    const s = this.settings();
    if (!s) return;
    this.savingSettings.set(true);
    this.errorMessage.set(null);

    this.companyService
      .updateSettings(this.companySlug, {
        taxLabel: s.taxLabel,
        taxRate: s.taxRate,
        tipRate: s.tipRate,
        allowTips: s.allowTips,
      })
      .subscribe({
        next: () => {
          this.savingSettings.set(false);
          this.settingsSaved.set(true);
          setTimeout(() => this.settingsSaved.set(false), 1800);
        },
        error: (err) => {
          this.savingSettings.set(false);
          this.errorMessage.set(err?.error?.error || 'No se pudo guardar la configuración.');
        },
      });
  }

  onFontChange(fontId: string): void {
    this.fontFamily.set(fontId);
    applyMenuFont(fontId); // preview inmediato — la tarjeta/hoja de producto usan --menu-font
  }

  currentFontStack(): string {
    return this.fontOptions.find((o) => o.id === this.fontFamily())?.stack ?? this.fontOptions[0].stack;
  }

  saveBranding(): void {
    this.savingBranding.set(true);
    this.errorMessage.set(null);

    this.companyService
      .update(this.companySlug, {
        primaryColor: this.primaryColor(),
        secondaryColor: this.secondaryColor(),
        fontFamily: this.fontFamily() as Company['fontFamily'],
      })
      .subscribe({
        next: (c) => {
          this.company.set(c);
          this.savingBranding.set(false);
          this.brandingSaved.set(true);
          // Aplica el cambio de una vez en el panel, igual que en el Shell.
          document.documentElement.style.setProperty('--primary', c.primaryColor);
          document.documentElement.style.setProperty('--secondary', c.secondaryColor);
          setTimeout(() => this.brandingSaved.set(false), 1800);
        },
        error: (err) => {
          this.savingBranding.set(false);
          this.errorMessage.set(err?.error?.error || 'No se pudo guardar el color de marca.');
        },
      });
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploadingLogo.set(true);
    this.logoError.set(null);

    this.companyService.uploadLogo(this.companySlug, file).subscribe({
      next: (res) => {
        // uploadLogo() solo devuelve { logoUrl }, no la compañía completa
        // — se actualiza el campo en el signal en vez de reemplazarlo todo.
        const current = this.company();
        if (current) this.company.set({ ...current, logoUrl: res.logoUrl });
        this.uploadingLogo.set(false);
        input.value = '';
      },
      error: (err) => {
        this.uploadingLogo.set(false);
        this.logoError.set(err?.error?.error || 'No se pudo subir el logo.');
        input.value = '';
      },
    });
  }
}