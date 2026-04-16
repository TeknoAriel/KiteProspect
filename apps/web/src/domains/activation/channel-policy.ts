/**
 * Política de canal determinística (sin IA).
 * WhatsApp solo con consent + ventana de sesión; si no, email; si no, manual.
 */

export type ChannelDecision =
  | { channel: "whatsapp"; reason: string }
  | { channel: "email"; reason: string }
  | { channel: "manual"; reason: string };

export function decideOutboundChannel(input: {
  hasWhatsAppConsent: boolean;
  waSessionActive: boolean;
  hasEmailConsent: boolean;
  lastOutboundWhatsAppAt: Date | null;
  lastOutboundEmailAt: Date | null;
  now: Date;
}): ChannelDecision {
  const { hasWhatsAppConsent, waSessionActive, hasEmailConsent } = input;

  if (hasWhatsAppConsent && waSessionActive) {
    const cool = whatsappCooldownOk(input.lastOutboundWhatsAppAt, input.now);
    if (cool.ok) {
      return { channel: "whatsapp", reason: "consent + ventana WA + cooldown OK" };
    }
    if (hasEmailConsent && emailCooldownOk(input.lastOutboundEmailAt, input.now).ok) {
      return {
        channel: "email",
        reason: `fallback email (WA cooldown: ${cool.reason})`,
      };
    }
    return { channel: "manual", reason: `WA en cooldown (${cool.reason}); email no disponible o en cooldown` };
  }

  if (hasEmailConsent && emailCooldownOk(input.lastOutboundEmailAt, input.now).ok) {
    return {
      channel: "email",
      reason: waSessionActive
        ? "email preferido por política (ej. sin WA consent)"
        : "email: fuera de ventana WA o sin sesión",
    };
  }

  return {
    channel: "manual",
    reason: "sin consentimiento utilizable ni ventana WA",
  };
}

const WA_COOLDOWN_MS = 4 * 60 * 60 * 1000;
const EMAIL_COOLDOWN_MS = 24 * 60 * 60 * 1000;

function whatsappCooldownOk(
  last: Date | null,
  now: Date,
): { ok: true } | { ok: false; reason: string } {
  if (!last) return { ok: true };
  const delta = now.getTime() - last.getTime();
  if (delta >= WA_COOLDOWN_MS) return { ok: true };
  return { ok: false, reason: "mínimo 4h entre envíos WA automáticos" };
}

function emailCooldownOk(
  last: Date | null,
  now: Date,
): { ok: true } | { ok: false; reason: string } {
  if (!last) return { ok: true };
  const delta = now.getTime() - last.getTime();
  if (delta >= EMAIL_COOLDOWN_MS) return { ok: true };
  return { ok: false, reason: "mínimo 24h entre emails de seguimiento" };
}
