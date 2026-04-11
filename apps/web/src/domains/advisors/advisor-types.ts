export type AdvisorStatus = "active" | "inactive";

/** Vista serializada para API/UI. */
export type SerializedAdvisor = {
  id: string;
  accountId: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  userId: string | null;
  branchId: string | null;
  branchName: string | null;
  branchSlug: string | null;
  linkedUserEmail: string | null;
  linkedUserName: string | null;
  assignmentsCount?: number;
  createdAt: string;
  updatedAt: string;
};
