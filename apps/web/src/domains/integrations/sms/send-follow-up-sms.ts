/**
 * Envío de SMS de seguimiento: Twilio (por defecto) o Telnyx (`SMS_PROVIDER=telnyx`, F3-E5+ L20).
 * Consentimiento y teléfono compartidos entre proveedores.
 */
import { prisma } from "@kite-prospect/db";
import { getSmsSendBlockReason } from "./sms-consent";
import {
  getConfiguredSmsProvider,
  isTelnyxSmsEnvConfigured,
  isTwilioSmsEnvConfigured,
} from "./sms-provider-config";
import { sendSmsViaTelnyxHttp } from "./telnyx-sms-send";
import { sendSmsViaTwilioHttp } from "./twilio-sms-send";

export type SendFollowUpSmsResult =
  | { ok: true; providerId: string }
  | { ok: false; reason: "not_configured" | "blocked" | "no_phone" | "send_failed"; error?: string };

function followUpSmsBody(objective: string | undefined, accountName: string): string {
  const o = objective?.trim();
  const base =
    o ?? `Te escribimos para dar seguimiento a tu consulta. — ${accountName}`;
  return base.slice(0, 1600);
}

/** Normaliza a E.164 con prefijo + (solo dígitos tras +). */
export function normalizePhoneE164ForSms(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return null;
  return `+${digits}`;
}

export async function sendFollowUpSmsToContact(params: {
  contactId: string;
  accountId: string;
  accountName: string;
  objective?: string | null;
}): Promise<SendFollowUpSmsResult> {
  const provider = getConfiguredSmsProvider();
  if (provider === "telnyx") {
    if (!isTelnyxSmsEnvConfigured()) {
      return { ok: false, reason: "not_configured" };
    }
  } else if (!isTwilioSmsEnvConfigured()) {
    return { ok: false, reason: "not_configured" };
  }

  const block = await getSmsSendBlockReason(params.contactId);
  if (block) {
    return { ok: false, reason: "blocked", error: block };
  }

  const contact = await prisma.contact.findFirst({
    where: { id: params.contactId, accountId: params.accountId },
    select: { phone: true },
  });
  const to = normalizePhoneE164ForSms(contact?.phone ?? "");
  if (!to) {
    return { ok: false, reason: "no_phone" };
  }

  const bodyText = followUpSmsBody(params.objective ?? undefined, params.accountName);

  if (provider === "telnyx") {
    const apiKey = process.env.TELNYX_API_KEY?.trim() ?? "";
    const from = process.env.TELNYX_FROM_NUMBER?.trim() ?? "";
    if (!apiKey || !from) {
      return { ok: false, reason: "not_configured" };
    }
    const r = await sendSmsViaTelnyxHttp({ to, bodyText, apiKey, fromNumber: from });
    if (!r.ok) {
      return { ok: false, reason: "send_failed", error: r.error };
    }
    return { ok: true, providerId: r.providerId };
  }

  const sid = process.env.TWILIO_ACCOUNT_SID?.trim() ?? "";
  const token = process.env.TWILIO_AUTH_TOKEN?.trim() ?? "";
  const from = process.env.TWILIO_FROM_NUMBER?.trim() ?? "";
  if (!sid || !token || !from) {
    return { ok: false, reason: "not_configured" };
  }
  const r = await sendSmsViaTwilioHttp({
    to,
    bodyText,
    accountSid: sid,
    authToken: token,
    fromNumber: from,
  });
  if (!r.ok) {
    return { ok: false, reason: "send_failed", error: r.error };
  }
  return { ok: true, providerId: r.providerId };
}
