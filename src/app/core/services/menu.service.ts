// src/app/core/services/menu.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API } from './api.endpoints';
import {
  Allergen, EffectiveProduct, Ingredient, MenuCategory, Modifier,
  ModifierGroup, Product, ProductMedia, RestaurantProductOverride,
} from '../models/menu.model';

@Injectable({ providedIn: 'root' })
export class MenuCategoryService {
  constructor(private http: HttpClient) {}

  // Nivel compañía (gestión)
  list(companySlug: string): Observable<MenuCategory[]> {
    return this.http.get<MenuCategory[]>(API.MENU_CATEGORIES.LIST(companySlug));
  }

  create(companySlug: string, data: Partial<MenuCategory>): Observable<MenuCategory> {
    return this.http.post<MenuCategory>(API.MENU_CATEGORIES.CREATE(companySlug), data);
  }

  update(companySlug: string, id: string, patch: Partial<MenuCategory>): Observable<MenuCategory> {
    return this.http.patch<MenuCategory>(API.MENU_CATEGORIES.UPDATE(companySlug, id), patch);
  }

  remove(companySlug: string, id: string): Observable<void> {
    return this.http.delete<void>(API.MENU_CATEGORIES.REMOVE(companySlug, id));
  }

  // Nivel sucursal (vista efectiva — pública, para el menú del cliente)
  listForBranch(companySlug: string, branchSlug: string): Observable<MenuCategory[]> {
    return this.http.get<MenuCategory[]>(API.BRANCH_MENU_CATEGORIES.LIST(companySlug, branchSlug));
  }
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(private http: HttpClient) {}

  // Nivel compañía (catálogo base)
  list(companySlug: string, categoryId?: string): Observable<Product[]> {
    const url = categoryId ? `${API.PRODUCTS.LIST(companySlug)}?categoryId=${categoryId}` : API.PRODUCTS.LIST(companySlug);
    return this.http.get<Product[]>(url);
  }

  detail(companySlug: string, id: string): Observable<Product> {
    return this.http.get<Product>(API.PRODUCTS.DETAIL(companySlug, id));
  }

  create(companySlug: string, data: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(API.PRODUCTS.CREATE(companySlug), data);
  }

  update(companySlug: string, id: string, patch: Partial<Product>): Observable<Product> {
    return this.http.patch<Product>(API.PRODUCTS.UPDATE(companySlug, id), patch);
  }

  remove(companySlug: string, id: string): Observable<void> {
    return this.http.delete<void>(API.PRODUCTS.REMOVE(companySlug, id));
  }

  setIngredients(companySlug: string, id: string, ingredientIds: string[]): Observable<void> {
    return this.http.put<void>(API.PRODUCTS.SET_INGREDIENTS(companySlug, id), { ingredientIds });
  }

  setAllergens(companySlug: string, id: string, allergenIds: string[]): Observable<void> {
    return this.http.put<void>(API.PRODUCTS.SET_ALLERGENS(companySlug, id), { allergenIds });
  }

  setModifierGroups(companySlug: string, id: string, modifierGroupIds: string[]): Observable<void> {
    return this.http.put<void>(API.PRODUCTS.SET_MODIFIER_GROUPS(companySlug, id), { modifierGroupIds });
  }

  /** Foto O video de producto — un solo input, el backend decide el tipo por el mimetype. */
  addMedia(companySlug: string, id: string, file: File, altText?: string): Observable<ProductMedia> {
    const formData = new FormData();
    formData.append('file', file);
    if (altText) formData.append('altText', altText);
    return this.http.post<ProductMedia>(API.PRODUCTS.ADD_MEDIA(companySlug, id), formData);
  }

  removeMedia(companySlug: string, id: string, mediaId: string): Observable<void> {
    return this.http.delete<void>(API.PRODUCTS.REMOVE_MEDIA(companySlug, id, mediaId));
  }

  setPrimaryMedia(companySlug: string, id: string, mediaId: string): Observable<ProductMedia> {
    return this.http.patch<ProductMedia>(API.PRODUCTS.SET_PRIMARY_MEDIA(companySlug, id, mediaId), {});
  }

  // Nivel sucursal (menú efectivo — público, con precio/disponibilidad ya resueltos)
  listForBranch(companySlug: string, branchSlug: string, categoryId?: string): Observable<EffectiveProduct[]> {
    const base = API.BRANCH_PRODUCTS.LIST(companySlug, branchSlug);
    const url = categoryId ? `${base}?categoryId=${categoryId}` : base;
    return this.http.get<EffectiveProduct[]>(url);
  }

  detailForBranch(companySlug: string, branchSlug: string, id: string): Observable<EffectiveProduct> {
    return this.http.get<EffectiveProduct>(API.BRANCH_PRODUCTS.DETAIL(companySlug, branchSlug, id));
  }

  setOverride(
    companySlug: string,
    branchSlug: string,
    id: string,
    override: { priceOverride?: number | null; isAvailableOverride?: boolean | null }
  ): Observable<RestaurantProductOverride> {
    return this.http.put<RestaurantProductOverride>(API.BRANCH_PRODUCTS.SET_OVERRIDE(companySlug, branchSlug, id), override);
  }

  clearOverride(companySlug: string, branchSlug: string, id: string): Observable<void> {
    return this.http.delete<void>(API.BRANCH_PRODUCTS.CLEAR_OVERRIDE(companySlug, branchSlug, id));
  }
}

@Injectable({ providedIn: 'root' })
export class IngredientService {
  constructor(private http: HttpClient) {}

  list(companySlug: string): Observable<Ingredient[]> {
    return this.http.get<Ingredient[]>(API.INGREDIENTS.LIST(companySlug));
  }

  create(companySlug: string, name: string): Observable<Ingredient> {
    return this.http.post<Ingredient>(API.INGREDIENTS.CREATE(companySlug), { name });
  }

  remove(companySlug: string, id: string): Observable<void> {
    return this.http.delete<void>(API.INGREDIENTS.REMOVE(companySlug, id));
  }
}

@Injectable({ providedIn: 'root' })
export class AllergenService {
  constructor(private http: HttpClient) {}

  list(): Observable<Allergen[]> {
    return this.http.get<Allergen[]>(API.ALLERGENS.LIST());
  }

  create(name: string, iconUrl?: string): Observable<Allergen> {
    return this.http.post<Allergen>(API.ALLERGENS.CREATE(), { name, iconUrl });
  }
}

@Injectable({ providedIn: 'root' })
export class ModifierGroupService {
  constructor(private http: HttpClient) {}

  list(companySlug: string): Observable<ModifierGroup[]> {
    return this.http.get<ModifierGroup[]>(API.MODIFIER_GROUPS.LIST(companySlug));
  }

  create(companySlug: string, data: Omit<Partial<ModifierGroup>, 'modifiers'> & { modifiers?: { name: string; price: number }[] }): Observable<ModifierGroup> {
    return this.http.post<ModifierGroup>(API.MODIFIER_GROUPS.CREATE(companySlug), data);
  }

  update(companySlug: string, id: string, patch: Partial<ModifierGroup>): Observable<ModifierGroup> {
    return this.http.patch<ModifierGroup>(API.MODIFIER_GROUPS.UPDATE(companySlug, id), patch);
  }

  remove(companySlug: string, id: string): Observable<void> {
    return this.http.delete<void>(API.MODIFIER_GROUPS.REMOVE(companySlug, id));
  }

  addModifier(companySlug: string, groupId: string, data: { name: string; price: number; sortOrder?: number }): Observable<Modifier> {
    return this.http.post<Modifier>(API.MODIFIER_GROUPS.ADD_MODIFIER(companySlug, groupId), data);
  }

  updateModifier(companySlug: string, id: string, patch: Partial<Modifier>): Observable<Modifier> {
    return this.http.patch<Modifier>(API.MODIFIERS.UPDATE(companySlug, id), patch);
  }

  removeModifier(companySlug: string, id: string): Observable<void> {
    return this.http.delete<void>(API.MODIFIERS.REMOVE(companySlug, id));
  }
}