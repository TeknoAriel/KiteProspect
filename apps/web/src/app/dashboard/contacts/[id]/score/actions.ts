"use server";

import { auth } from "@/lib/auth";
import { calculateLeadScore } from "@/domains/scoring/services/calculate-score";

export async function recalculateContactScoreAction(contactId: string) {
  const session = await auth();
  if (!session?.user?.accountId) {
    throw new Error("No autorizado");
  }
  await calculateLeadScore(contactId, session.user.accountId);
}
