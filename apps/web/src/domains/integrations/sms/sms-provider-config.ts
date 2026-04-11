/**
 * Selección de proveedor SMS para seguimientos (F3-E5 Twilio L16; F3-E5+ Telnyx L20).
 * `SMS_PROVIDER=telnyx` usa Telnyx; cualquier otro valor o vacío → Twilio.
 */
export type SmsProviderName = "twilio" | "telnyx";

export function getConfiguredSmsProvider(): SmsProviderName {
  const p = (process.env.SMS_PROVIDER ?? "twilio").trim().toLowerCase();
  return p === "telnyx" ? "telnyx" : "twilio";
}

export function isTwilioSmsEnvConfigured(): boolean {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_FROM_NUMBER?.trim();
  return Boolean(sid && token && from);
}

export function isTelnyxSmsEnvConfigured(): boolean {
  const key = process.env.TELNYX_API_KEY?.trim();
  const from = process.env.TELNYX_FROM_NUMBER?.trim();
  return Boolean(key && from);
}
