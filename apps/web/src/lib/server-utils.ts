/**
 * Utilidades para server components/actions
 * Resuelve accountId desde sesión o headers
 */
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getAccountId(): Promise<string> {
  const session = await auth();
  if (session?.user?.accountId) {
    return session.user.accountId;
  }

  // Fallback desde headers (middleware)
  const headersList = await headers();
  const accountId = headersList.get("x-account-id");
  if (accountId) {
    return accountId;
  }

  throw new Error("No accountId found in session or headers");
}

export async function requireAuth() {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}
