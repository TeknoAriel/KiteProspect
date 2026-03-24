/**
 * Parser mínimo del webhook WhatsApp Cloud API (Meta).
 */

export type ParsedInboundMessage = {
  from: string;
  waMessageId: string;
  text: string | null;
  type: string;
  timestamp?: string;
};

export type ParsedStatus = {
  waMessageId: string;
  status: string;
  timestamp?: string;
};

export type ParseWebhookResult =
  | { kind: "messages"; items: ParsedInboundMessage[] }
  | { kind: "statuses"; items: ParsedStatus[] }
  | { kind: "empty" };

function asObj(x: unknown): Record<string, unknown> | null {
  return typeof x === "object" && x !== null ? (x as Record<string, unknown>) : null;
}

/**
 * Extrae mensajes entrantes o actualizaciones de estado del body del webhook.
 */
export function parseWhatsAppWebhookPayload(body: unknown): ParseWebhookResult {
  const root = asObj(body);
  if (!root || root.object !== "whatsapp_business_account") {
    return { kind: "empty" };
  }

  const entry = root.entry;
  if (!Array.isArray(entry) || entry.length === 0) {
    return { kind: "empty" };
  }

  const messages: ParsedInboundMessage[] = [];
  const statuses: ParsedStatus[] = [];

  for (const ent of entry) {
    const e = asObj(ent);
    const changes = e?.changes;
    if (!Array.isArray(changes)) continue;

    for (const ch of changes) {
      const c = asObj(ch);
      const value = asObj(c?.value);
      if (!value) continue;

      const msgs = value.messages;
      if (Array.isArray(msgs)) {
        for (const m of msgs) {
          const msg = asObj(m);
          if (!msg) continue;
          const from = typeof msg.from === "string" ? msg.from : "";
          const id = typeof msg.id === "string" ? msg.id : "";
          const type = typeof msg.type === "string" ? msg.type : "unknown";
          let text: string | null = null;
          if (type === "text") {
            const t = asObj(msg.text);
            text = typeof t?.body === "string" ? t.body : null;
          }
          const ts = typeof msg.timestamp === "string" ? msg.timestamp : undefined;
          if (from && id) {
            messages.push({ from, waMessageId: id, text, type, timestamp: ts });
          }
        }
      }

      const sts = value.statuses;
      if (Array.isArray(sts)) {
        for (const s of sts) {
          const st = asObj(s);
          if (!st) continue;
          const id = typeof st.id === "string" ? st.id : "";
          const status = typeof st.status === "string" ? st.status : "";
          const ts = typeof st.timestamp === "string" ? st.timestamp : undefined;
          if (id && status) {
            statuses.push({ waMessageId: id, status, timestamp: ts });
          }
        }
      }
    }
  }

  if (messages.length > 0) return { kind: "messages", items: messages };
  if (statuses.length > 0) return { kind: "statuses", items: statuses };
  return { kind: "empty" };
}
