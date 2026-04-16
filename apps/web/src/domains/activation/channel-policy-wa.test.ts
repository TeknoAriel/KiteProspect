import { describe, expect, it } from "vitest";
import { decideOutboundChannel } from "./channel-policy";

describe("decideOutboundChannel — WA no elegible → email o manual", () => {
  const now = new Date("2026-04-08T12:00:00.000Z");

  it("sin ventana WA pero con email → email", () => {
    const d = decideOutboundChannel({
      hasWhatsAppConsent: true,
      waSessionActive: false,
      hasEmailConsent: true,
      lastOutboundWhatsAppAt: null,
      lastOutboundEmailAt: null,
      now,
    });
    expect(d.channel).toBe("email");
  });

  it("sin consentimiento WA ni email → manual", () => {
    const d = decideOutboundChannel({
      hasWhatsAppConsent: false,
      waSessionActive: false,
      hasEmailConsent: false,
      lastOutboundWhatsAppAt: null,
      lastOutboundEmailAt: null,
      now,
    });
    expect(d.channel).toBe("manual");
  });
});
