import { parseWhatsAppWebhookPayload } from "./parse-cloud-api";
import { applyWhatsAppStatusUpdate, ingestInboundWhatsAppMessage } from "./ingest-inbound";

export async function processWhatsAppWebhookBody(accountId: string, body: unknown): Promise<{
  processed: number;
  kind: "messages" | "statuses" | "empty";
}> {
  const parsed = parseWhatsAppWebhookPayload(body);

  if (parsed.kind === "empty") {
    return { processed: 0, kind: "empty" };
  }

  if (parsed.kind === "statuses") {
    let n = 0;
    for (const st of parsed.items) {
      if (await applyWhatsAppStatusUpdate(st)) n++;
    }
    return { processed: n, kind: "statuses" };
  }

  let n = 0;
  for (const m of parsed.items) {
    const r = await ingestInboundWhatsAppMessage(accountId, m);
    if (!r.skipped) n++;
  }
  return { processed: n, kind: "messages" };
}
