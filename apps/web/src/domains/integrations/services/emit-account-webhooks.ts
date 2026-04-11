/**
 * Entrega webhooks salientes firmados (F3-E3). No bloquea la petición principal.
 */
import { createHmac, randomUUID } from "node:crypto";
import { prisma } from "@kite-prospect/db";
import { logStructured } from "@/lib/structured-log";
import {
  type WebhookEventType,
  normalizeStoredEvents,
} from "./webhook-event-types";

const WEBHOOK_TIMEOUT_MS = 8000;

export type EmitWebhookPayload = {
  accountId: string;
  event: WebhookEventType;
  data: Record<string, unknown>;
};

function signBody(rawBody: string, signingSecret: string): string {
  return createHmac("sha256", signingSecret).update(rawBody, "utf8").digest("hex");
}

async function deliverOne(
  subscriptionId: string,
  url: string,
  signingSecret: string,
  rawBody: string,
  event: WebhookEventType,
): Promise<void> {
  const sig = signBody(rawBody, signingSecret);
  const deliveryId = randomUUID();
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), WEBHOOK_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "X-Kite-Event": event,
        "X-Kite-Signature": `sha256=${sig}`,
        "X-Kite-Delivery-Id": deliveryId,
        "User-Agent": "Kite-Prospect-Webhooks/1",
      },
      body: rawBody,
      signal: ac.signal,
    });
    logStructured("webhook_delivered", {
      subscriptionId,
      status: res.status,
      ok: res.ok,
      event,
    });
    if (!res.ok) {
      console.warn("[webhook] non-OK response", subscriptionId, res.status);
    }
  } finally {
    clearTimeout(t);
  }
}

/**
 * Emite a todas las suscripciones activas del tenant que escuchan `event`.
 * Errores se registran en consola; no relanza.
 */
export async function emitAccountWebhooks(payload: EmitWebhookPayload): Promise<void> {
  const { accountId, event, data } = payload;
  const subs = await prisma.webhookSubscription.findMany({
    where: {
      accountId,
      revokedAt: null,
    },
    select: {
      id: true,
      url: true,
      signingSecret: true,
      events: true,
    },
  });

  const envelope = {
    event,
    accountId,
    occurredAt: new Date().toISOString(),
    data,
  };
  const rawBody = JSON.stringify(envelope);

  for (const sub of subs) {
    const subscribed = normalizeStoredEvents(sub.events);
    if (!subscribed.includes(event)) continue;
    void deliverOne(sub.id, sub.url, sub.signingSecret, rawBody, event).catch((e) => {
      console.error("[webhook] delivery failed", sub.id, e);
      logStructured("webhook_delivery_failed", {
        subscriptionId: sub.id,
        event,
        message: e instanceof Error ? e.message : String(e),
      });
    });
  }
}
