export const WEBHOOK_EVENT_TYPES = [
  "lead.captured",
  "contact.assignment_changed",
  "contact.stages_updated",
  "follow_up.sequence_started",
  "contact.external_id_updated",
] as const;

export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[number];

export const DEFAULT_WEBHOOK_EVENTS: WebhookEventType[] = [...WEBHOOK_EVENT_TYPES];

export function parseWebhookEventsInput(input: unknown): WebhookEventType[] | null {
  if (input === undefined || input === null) {
    return DEFAULT_WEBHOOK_EVENTS;
  }
  if (!Array.isArray(input)) return null;
  const allowed = new Set<string>(WEBHOOK_EVENT_TYPES);
  const out: WebhookEventType[] = [];
  for (const e of input) {
    if (typeof e === "string" && allowed.has(e)) {
      out.push(e as WebhookEventType);
    }
  }
  return out.length === 0 ? null : out;
}

export function normalizeStoredEvents(events: unknown): WebhookEventType[] {
  const parsed = parseWebhookEventsInput(events);
  if (parsed) return parsed;
  return DEFAULT_WEBHOOK_EVENTS;
}
