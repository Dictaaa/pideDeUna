export interface AdminModifierOption {
  id: string;
  name: string;
  price: string;
  isActive: boolean;
  sortOrder: number;
}

export interface AdminModifierGroup {
  id: string;
  name: string;
  minSelections: number;
  maxSelections: number;
  required: boolean;
  sortOrder: number;
  options: AdminModifierOption[];
}

export interface ModifierGroupFormValue {
  name: string;
  minSelections: number;
  maxSelections: number;
  required: boolean;
  sortOrder: number;
}

export interface ModifierOptionFormValue {
  name: string;
  price: number;
}