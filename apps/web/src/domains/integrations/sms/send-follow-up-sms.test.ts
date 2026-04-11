import { describe, expect, it } from "vitest";
import { normalizePhoneE164ForSms } from "./send-follow-up-sms";

describe("normalizePhoneE164ForSms", () => {
  it("adds plus prefix", () => {
    expect(normalizePhoneE164ForSms("+54 11 1234 5678")).toBe("+541112345678");
  });

  it("rejects too short", () => {
    expect(normalizePhoneE164ForSms("123")).toBe(null);
  });
});
