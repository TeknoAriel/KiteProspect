import { describe, expect, it } from "vitest";
import {
  buildDedupeKey,
  deterministicEventIdForDedupe,
  deterministicOccurredAtIso,
} from "./handoff-webhook";

describe("handoff determinístico", () => {
  it("mismo dedupe_key → mismo event_id y occurred_at", () => {
    const dk = buildDedupeKey("acc1", "lead1");
    expect(deterministicEventIdForDedupe(dk)).toBe(
      deterministicEventIdForDedupe(dk),
    );
    expect(deterministicOccurredAtIso(dk)).toBe(
      deterministicOccurredAtIso(dk),
    );
  });
});
