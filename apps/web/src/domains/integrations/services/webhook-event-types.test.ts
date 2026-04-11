import { describe, expect, it } from "vitest";
import {
  DEFAULT_WEBHOOK_EVENTS,
  parseWebhookEventsInput,
  WEBHOOK_EVENT_TYPES,
} from "./webhook-event-types";

describe("webhook-event-types", () => {
  it("defaults when events omitted", () => {
    expect(parseWebhookEventsInput(undefined)).toEqual(DEFAULT_WEBHOOK_EVENTS);
    expect(parseWebhookEventsInput(null)).toEqual(DEFAULT_WEBHOOK_EVENTS);
  });

  it("filters unknown strings", () => {
    expect(parseWebhookEventsInput(["lead.captured", "invalid"])).toEqual(["lead.captured"]);
  });

  it("returns null for empty after filter", () => {
    expect(parseWebhookEventsInput([])).toBe(null);
    expect(parseWebhookEventsInput(["x"])).toBe(null);
  });

  it("WEBHOOK_EVENT_TYPES includes external_id webhook", () => {
    expect(WEBHOOK_EVENT_TYPES).toContain("contact.external_id_updated");
    expect(WEBHOOK_EVENT_TYPES.length).toBe(5);
  });
});
