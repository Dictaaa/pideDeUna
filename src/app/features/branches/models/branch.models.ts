export interface AdminBranch {
  id: string;
  slug: string;
  name: string;
  status: string;
}

export interface AdminCompanyPlan {
  id: string;
  code: string;
  name: string;
  maxRestaurants: number | null; // null = ilimitadas
}

export interface AdminCompany {
  id: string;
  slug: string;
  name: string;
  status: string;
  restaurants: AdminBranch[];
  plan: AdminCompanyPlan | null;
  subscriptionStatus: string | null;
}

export interface BranchFormValue {
  name: string;
  slug: string;
}