import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SettingsAdmin } from '../../services/settings-admin';
import { RestaurantSettings, SETTINGS_TOGGLES } from '../../models/settings.models';
import { Restaurant } from '../../../../core/models/menu';
import { Skeleton } from '../../../../shared/components/skeleton/skeleton';
import { RestaurantProfile } from '../../../dashboard/services/restaurant-profile';
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
  private settingsService = inject(SettingsAdmin);
  private restaurantProfile = inject(RestaurantProfile);

  slug = this.route.parent!.snapshot.paramMap.get('slug')!;
  toggles = SETTINGS_TOGGLES;
  fontOptions = MENU_FONT_OPTIONS;

  loading = signal(true);
  settings = signal<RestaurantSettings | null>(null);
  restaurant = signal<Restaurant | null>(null);

  savingSettings = signal(false);
  savingBranding = signal(false);
  settingsSaved = signal(false);
  brandingSaved = signal(false);
  errorMessage = signal<string | null>(null);

  primaryColor = signal('#FF8A1E');
  secondaryColor = signal('#FFC02E');
  fontFamily = signal('inter');

  uploadingLogo = signal(false);
  logoError = signal<string | null>(null);

  constructor() {
    this.settingsService.getSettings(this.slug).subscribe({
      next: (s) => {
        this.settings.set(s);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.settingsService.getProfile(this.slug).subscribe({
      next: (r) => {
        this.restaurant.set(r);
        this.primaryColor.set(r.primaryColor);
        this.secondaryColor.set(r.secondaryColor);
        this.fontFamily.set(r.fontFamily);
      },
    });
  }

  toggleValue(key: keyof Omit<RestaurantSettings, 'restaurantId'>): boolean {
    return !!this.settings()?.[key];
  }

  setToggle(key: keyof Omit<RestaurantSettings, 'restaurantId'>, value: boolean): void {
    const current = this.settings();
    if (!current) return;
    this.settings.set({ ...current, [key]: value });
  }

  saveSettings(): void {
    const s = this.settings();
    if (!s) return;
    this.savingSettings.set(true);
    this.errorMessage.set(null);

    const { restaurantId, ...editable } = s;
    this.settingsService.updateSettings(this.slug, editable).subscribe({
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

    this.settingsService
      .updateBranding(this.slug, {
        primaryColor: this.primaryColor(),
        secondaryColor: this.secondaryColor(),
        fontFamily: this.fontFamily(),
      })
      .subscribe({
        next: (r) => {
          this.restaurant.set(r);
          this.savingBranding.set(false);
          this.brandingSaved.set(true);
          // Aplica el cambio de una vez en el panel, igual que en el Shell.
          document.documentElement.style.setProperty('--primary', r.primaryColor);
          document.documentElement.style.setProperty('--secondary', r.secondaryColor);
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

    this.restaurantProfile.uploadLogo(this.slug, file).subscribe({
      next: (r) => {
        this.restaurant.set(r);
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
