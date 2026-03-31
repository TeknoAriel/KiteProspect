/**
 * Envío transaccional de seguimiento por email (Resend API REST; sin dependencia npm extra).
 * Requiere dominio/remitente verificados en Resend.
 */
import { prisma } from "@kite-prospect/db";
import { getEmailSendBlockReason } from "./email-consent";

export type SendFollowUpEmailResult =
  | { ok: true; providerId: string }
  | { ok: false; reason: "not_configured" | "blocked" | "no_email" | "send_failed"; error?: string };

function followUpEmailBody(objective: string | undefined, accountName: string): string {
  const o = objective?.trim();
  const base =
    o ??
    "Te escribimos para dar seguimiento a tu consulta. Si querés, respondé este correo o escribinos por el canal que prefieras.";
  return `${base}\n\n— ${accountName}`.slice(0, 50_000);
}

export async function sendFollowUpEmailToContact(params: {
  contactId: string;
  accountId: string;
  accountName: string;
  objective?: string | null;
}): Promise<SendFollowUpEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.FOLLOW_UP_FROM_EMAIL?.trim();
  if (!apiKey || !from) {
    return { ok: false, reason: "not_configured" };
  }

  const block = await getEmailSendBlockReason(params.contactId);
  if (block) {
    return { ok: false, reason: "blocked", error: block };
  }

  const contact = await prisma.contact.findFirst({
    where: { id: params.contactId, accountId: params.accountId },
    select: { email: true },
  });
  const to = contact?.email?.trim();
  if (!to || !to.includes("@")) {
    return { ok: false, reason: "no_email" };
  }

  const prefix = process.env.FOLLOW_UP_EMAIL_SUBJECT_PREFIX?.trim() || "Seguimiento";
  const subject = `${prefix} · ${params.accountName}`.slice(0, 200);
  const text = followUpEmailBody(params.objective ?? undefined, params.accountName);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text,
      }),
    });

    const json = (await res.json()) as { id?: string; message?: string };
    if (!res.ok) {
      return {
        ok: false,
        reason: "send_failed",
        error: json?.message ?? res.statusText,
      };
    }
    if (!json.id) {
      return { ok: false, reason: "send_failed", error: "Respuesta sin id" };
    }
    return { ok: true, providerId: json.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, reason: "send_failed", error: msg };
  }
}
