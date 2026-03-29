"use server";

import { auth } from "@/lib/auth";
import { sendPropertyRecommendationWhatsApp } from "@/domains/matching/services/send-property-recommendation-whatsapp";
import { revalidatePath } from "next/cache";

export type SendRecommendationResult =
  | { ok: true; recommendationId: string }
  | { ok: false; error: string };

export async function sendPropertyRecommendationWhatsAppAction(
  contactId: string,
  propertyMatchId: string,
): Promise<SendRecommendationResult> {
  const session = await auth();
  if (!session?.user?.accountId) {
    return { ok: false, error: "No autorizado." };
  }
  const role = session.user.role;
  if (role !== "admin" && role !== "coordinator") {
    return { ok: false, error: "Solo administradores o coordinadores pueden enviar recomendaciones por WhatsApp." };
  }

  const result = await sendPropertyRecommendationWhatsApp({
    accountId: session.user.accountId,
    contactId,
    propertyMatchId,
    actorUserId: session.user.id ?? null,
  });

  if (!result.ok) {
    return result;
  }

  revalidatePath(`/dashboard/contacts/${contactId}`);
  return { ok: true, recommendationId: result.recommendationId };
}
