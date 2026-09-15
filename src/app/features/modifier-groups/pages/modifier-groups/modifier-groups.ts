import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ModifierGroupAdmin } from '../../services/modifier-group-admin';
import {
  AdminModifierGroup,
  AdminModifierOption,
  ModifierGroupFormValue,
  ModifierOptionFormValue,
} from '../../models/modifier-group.models';
import { TableSkeleton } from '../../../../shared/components/table-skeleton/table-skeleton';

const EMPTY_FORM: ModifierGroupFormValue = {
  name: '',
  minSelections: 0,
  maxSelections: 1,
  required: false,
  sortOrder: 0,
};

@Component({
  selector: 'app-modifier-groups',
  standalone: true,
  imports: [FormsModule, DecimalPipe, TableSkeleton],
  templateUrl: './modifier-groups.html',
  styleUrl: './modifier-groups.scss',
})
export class ModifierGroups {
  private route = inject(ActivatedRoute);
  private service = inject(ModifierGroupAdmin);

  slug = this.route.parent!.snapshot.paramMap.get('slug')!;

  loading = signal(true);
  groups = signal<AdminModifierGroup[]>([]);

  // Panel de crear/editar el GRUPO (nombre, mínimos/máximos, obligatorio).
  formOpen = signal(false);
  editingGroupId = signal<string | null>(null);
  form = signal<ModifierGroupFormValue>({ ...EMPTY_FORM });
  saving = signal(false);
  errorMessage = signal<string | null>(null);

  // Opciones iniciales al CREAR un grupo nuevo — se arman antes de guardar.
  draftOptions = signal<ModifierOptionFormValue[]>([]);
  draftOptionName = signal('');
  draftOptionPrice = signal(0);

  // Agregar una opción a un grupo que YA EXISTE — inline, dentro de su tarjeta.
  addingOptionGroupId = signal<string | null>(null);
  optionName = signal('');
  optionPrice = signal(0);

  constructor() {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.service.list(this.slug).subscribe({
      next: (groups) => {
        this.groups.set(groups);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // ---------------- Crear / editar grupo ----------------

  openCreate(): void {
    this.editingGroupId.set(null);
    this.form.set({ ...EMPTY_FORM, sortOrder: this.groups().length });
    this.draftOptions.set([]);
    this.draftOptionName.set('');
    this.draftOptionPrice.set(0);
    this.errorMessage.set(null);
    this.formOpen.set(true);
  }

  openEdit(group: AdminModifierGroup): void {
    this.editingGroupId.set(group.id);
    this.form.set({
      name: group.name,
      minSelections: group.minSelections,
      maxSelections: group.maxSelections,
      required: group.required,
      sortOrder: group.sortOrder,
    });
    this.errorMessage.set(null);
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
  }

  updateField<K extends keyof ModifierGroupFormValue>(key: K, value: ModifierGroupFormValue[K]): void {
    this.form.set({ ...this.form(), [key]: value });
  }

  addDraftOption(): void {
    if (!this.draftOptionName().trim()) return;
    this.draftOptions.set([...this.draftOptions(), { name: this.draftOptionName().trim(), price: this.draftOptionPrice() }]);
    this.draftOptionName.set('');
    this.draftOptionPrice.set(0);
  }

  removeDraftOption(index: number): void {
    this.draftOptions.set(this.draftOptions().filter((_, i) => i !== index));
  }

  save(): void {
    if (!this.form().name.trim()) {
      this.errorMessage.set('El nombre del grupo es obligatorio.');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);

    const id = this.editingGroupId();
    const request = id
      ? this.service.update(this.slug, id, this.form())
      : this.service.create(this.slug, this.form(), this.draftOptions());

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.reload();
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err?.error?.error || 'No se pudo guardar el grupo.');
      },
    });
  }

  removeGroup(group: AdminModifierGroup): void {
    if (!confirm(`¿Eliminar "${group.name}" y todas sus opciones? Los productos que lo usen se quedan sin este grupo.`)) return;
    this.service.remove(this.slug, group.id).subscribe({ next: () => this.reload() });
  }

  // ---------------- Opciones de un grupo existente ----------------

  startAddOption(group: AdminModifierGroup): void {
    this.addingOptionGroupId.set(group.id);
    this.optionName.set('');
    this.optionPrice.set(0);
  }

  cancelAddOption(): void {
    this.addingOptionGroupId.set(null);
  }

  confirmAddOption(group: AdminModifierGroup): void {
    if (!this.optionName().trim()) return;
    this.service.addOption(this.slug, group.id, { name: this.optionName().trim(), price: this.optionPrice() }).subscribe({
      next: () => {
        this.addingOptionGroupId.set(null);
        this.reload();
      },
    });
  }

  removeOption(group: AdminModifierGroup, option: AdminModifierOption): void {
    if (!confirm(`¿Quitar "${option.name}"?`)) return;
    this.service.removeOption(this.slug, group.id, option.id).subscribe({ next: () => this.reload() });
  }
}