import type { User } from "@kite-prospect/db";
import type { SerializedUser } from "./user-types";

export function serializeUser(
  user: User & { _count?: { advisors: number } },
): SerializedUser {
  return {
    id: user.id,
    accountId: user.accountId,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    advisorsCount: user._count?.advisors,
  };
}
