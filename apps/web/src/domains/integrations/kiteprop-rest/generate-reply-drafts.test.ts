import { describe, expect, it } from "vitest";
import { generateReplyDrafts } from "./generate-reply-drafts";
import { classifyKitepropChannel } from "./classify-kiteprop-channel";

describe("generateReplyDrafts", () => {
  it("whatsapp con propiedad", () => {
    const ch = classifyKitepropChannel({ channelRaw: "whatsapp" });
    const g = generateReplyDrafts({
      normalized: {
        messageBody: "Precio?",
        occurredAt: new Date(),
        raw: {},
      },
      channel: ch,
      propertyTitle: "Depto Palermo",
      contactName: "Ana",
    });
    expect(g.draftKind).toBe("whatsapp");
    expect(g.payload.whatsapp?.body).toContain("Palermo");
    expect(g.manualReviewRequired).toBe(false);
  });

  it("sin contexto → manual", () => {
    const ch = classifyKitepropChannel({});
    const g = generateReplyDrafts({
      normalized: { occurredAt: new Date(), raw: {} },
      channel: ch,
      propertyTitle: null,
      contactName: null,
    });
    expect(g.manualReviewRequired).toBe(true);
  });
});
