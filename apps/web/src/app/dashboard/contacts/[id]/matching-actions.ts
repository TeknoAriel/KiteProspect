"use server";

import { auth } from "@/lib/auth";
import { syncPropertyMatchesForContact } from "@/domains/matching/services/sync-property-matches";
import { logStructured } from "@/lib/structured-log";
import { revalidatePath } from "next/cache";

export type RecalculateMatchesResult =
  | { ok: true; matchedCount: number }
  | { ok: false; error: string };

export async function recalculatePropertyMatchesAction(
  contactId: string,
): Promise<RecalculateMatchesResult> {
  const session = await auth();
  if (!session?.user?.accountId) {
    return { ok: false, error: "No autorizado." };
  }

  logStructured("contact_matches_recalc_started", {
    accountId: session.user.accountId,
    contactId,
  });

  const result = await syncPropertyMatchesForContact(
    contactId,
    session.user.accountId,
    session.user.id ?? null,
  );

  if (!result.ok) {
    return result;
  }

  revalidatePath(`/dashboard/contacts/${contactId}`);
  return { ok: true, matchedCount: result.matchedCount };
}
