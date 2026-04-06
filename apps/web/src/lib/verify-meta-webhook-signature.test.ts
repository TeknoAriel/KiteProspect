import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyMetaWebhookSignature256 } from "./verify-meta-webhook-signature";

describe("verifyMetaWebhookSignature256", () => {
  it("acepta firma válida", () => {
    const secret = "test-app-secret";
    const body = '{"hello":"world"}';
    const sig = `sha256=${createHmac("sha256", secret).update(body, "utf8").digest("hex")}`;
    expect(verifyMetaWebhookSignature256(body, sig, secret)).toBe(true);
  });

  it("rechaza firma incorrecta", () => {
    expect(
      verifyMetaWebhookSignature256('{"a":1}', "sha256=deadbeef", "secret"),
    ).toBe(false);
  });

  it("rechaza header ausente", () => {
    expect(verifyMetaWebhookSignature256("{}", null, "s")).toBe(false);
  });
});
