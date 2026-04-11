/**
 * Envío SMS vía Twilio REST (sin SDK npm).
 */

export type TwilioSendResult =
  | { ok: true; providerId: string }
  | { ok: false; error: string };

export async function sendSmsViaTwilioHttp(params: {
  to: string;
  bodyText: string;
  accountSid: string;
  authToken: string;
  fromNumber: string;
}): Promise<TwilioSendResult> {
  const { to, bodyText, accountSid, authToken, fromNumber } = params;
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: to,
        From: fromNumber,
        Body: bodyText,
      }).toString(),
    });

    const json = (await res.json()) as {
      sid?: string;
      message?: string;
      error_message?: string;
    };
    if (!res.ok) {
      return {
        ok: false,
        error: json?.message ?? json?.error_message ?? res.statusText,
      };
    }
    if (!json.sid) {
      return { ok: false, error: "Respuesta sin sid" };
    }
    return { ok: true, providerId: json.sid };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
