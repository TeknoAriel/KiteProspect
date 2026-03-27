export type UserRole = "admin" | "coordinator" | "advisor";
export type UserStatus = "active" | "inactive";

/** Vista serializada para API/UI sin exponer hash. */
export type SerializedUser = {
  id: string;
  accountId: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  advisorsCount?: number;
};
