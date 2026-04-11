/**
 * Envío SMS vía Telnyx API v2 (sin SDK npm).
 * https://developers.telnyx.com/docs/messaging/messages/send-message
 */

export type TelnyxSendResult =
  | { ok: true; providerId: string }
  | { ok: false; error: string };

export async function sendSmsViaTelnyxHttp(params: {
  to: string;
  bodyText: string;
  apiKey: string;
  fromNumber: string;
}): Promise<TelnyxSendResult> {
  const { to, bodyText, apiKey, fromNumber } = params;
  const url = "https://api.telnyx.com/v2/messages";

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromNumber,
        to,
        text: bodyText,
      }),
    });

    const json = (await res.json()) as {
      data?: { id?: string };
      errors?: { detail?: string }[];
    };
    if (!res.ok) {
      const detail =
        json?.errors?.[0]?.detail ??
        (typeof json === "object" && json !== null && "message" in json
          ? String((json as { message?: unknown }).message)
          : null);
      return {
        ok: false,
        error: detail ?? res.statusText,
      };
    }
    const id = json?.data?.id;
    if (!id || typeof id !== "string") {
      return { ok: false, error: "Respuesta sin data.id" };
    }
    return { ok: true, providerId: id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
