import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs/operators';
import { Api } from '../../../core/services/api';
import { API } from '../../../core/services/api.endpoints';
import {
  AdminModifierGroup,
  AdminModifierOption,
  ModifierGroupFormValue,
  ModifierOptionFormValue,
} from '../models/modifier-group.models';

/**
 * Algunos backends (según cómo se haya nombrado la asociación
 * Sequelize) devuelven las opciones del grupo bajo la clave "options",
 * otros bajo "modifiers" — en vez de exigir que el backend use un
 * nombre exacto, el frontend acepta cualquiera de los dos y siempre
 * expone "options" hacia el resto de la app.
 */
function normalizeGroup(raw: any): AdminModifierGroup {
  return { ...raw, options: raw.options ?? raw.modifiers ?? [] };
}

@Injectable({ providedIn: 'root' })
export class ModifierGroupAdmin {
  private api = inject(Api);

  list(slug: string) {
    return this.api
      .get<any[]>(API.MODIFIER_GROUPS.LIST(slug))
      .pipe(map((groups) => groups.map(normalizeGroup)));
  }

  create(slug: string, value: ModifierGroupFormValue, options: ModifierOptionFormValue[] = []) {
    return this.api
      .post<any>(API.MODIFIER_GROUPS.CREATE(slug), { ...value, options })
      .pipe(map(normalizeGroup));
  }

  update(slug: string, id: string, value: Partial<ModifierGroupFormValue>) {
    return this.api.patch<AdminModifierGroup>(API.MODIFIER_GROUPS.BY_ID(slug, id), value);
  }

  remove(slug: string, id: string) {
    return this.api.delete<void>(API.MODIFIER_GROUPS.BY_ID(slug, id));
  }

  addOption(slug: string, groupId: string, value: ModifierOptionFormValue) {
    return this.api.post<AdminModifierOption>(API.MODIFIER_GROUPS.ADD_OPTION(slug, groupId), value);
  }

  updateOption(slug: string, groupId: string, optionId: string, value: Partial<ModifierOptionFormValue>) {
    return this.api.patch<AdminModifierOption>(API.MODIFIER_GROUPS.OPTION(slug, groupId, optionId), value);
  }

  removeOption(slug: string, groupId: string, optionId: string) {
    return this.api.delete<void>(API.MODIFIER_GROUPS.OPTION(slug, groupId, optionId));
  }
}