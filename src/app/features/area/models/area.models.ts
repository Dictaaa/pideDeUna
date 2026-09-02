export interface AdminArea {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  status: string; // active | inactive
}

export interface AreaFormValue {
  name: string;
  description: string;
  sortOrder: number;
  status: string;
}