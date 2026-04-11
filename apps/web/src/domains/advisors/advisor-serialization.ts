import type { Advisor, Branch, User } from "@kite-prospect/db";
import type { SerializedAdvisor } from "./advisor-types";

type Row = Advisor & {
  user?: Pick<User, "email" | "name"> | null;
  branch?: Pick<Branch, "id" | "name" | "slug"> | null;
  _count?: { assignments: number };
};

export function serializeAdvisor(a: Row): SerializedAdvisor {
  return {
    id: a.id,
    accountId: a.accountId,
    name: a.name,
    email: a.email,
    phone: a.phone,
    status: a.status,
    userId: a.userId,
    branchId: a.branchId ?? null,
    branchName: a.branch?.name ?? null,
    branchSlug: a.branch?.slug ?? null,
    linkedUserEmail: a.user?.email ?? null,
    linkedUserName: a.user?.name ?? null,
    assignmentsCount: a._count?.assignments,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}
