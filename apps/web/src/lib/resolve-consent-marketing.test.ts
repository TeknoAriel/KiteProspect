import { describe, expect, it } from "vitest";
import { resolveConsentMarketingInput } from "./resolve-consent-marketing";

describe("resolveConsentMarketingInput", () => {
  it("respeta true/false explícitos", () => {
    expect(resolveConsentMarketingInput({ consentMarketing: true })).toBe(true);
    expect(resolveConsentMarketingInput({ consentMarketing: false })).toBe(
      false,
    );
    expect(resolveConsentMarketingInput({ consentMarketing: "true" })).toBe(
      true,
    );
    expect(resolveConsentMarketingInput({ consentMarketing: "false" })).toBe(
      false,
    );
  });
});
