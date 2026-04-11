import { afterEach, describe, expect, it, vi } from "vitest";
import { sendSmsViaTelnyxHttp } from "./telnyx-sms-send";

describe("sendSmsViaTelnyxHttp", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("ok con data.id", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ data: { id: "msg-telnyx-1" } }),
      })) as unknown as typeof fetch,
    );
    const r = await sendSmsViaTelnyxHttp({
      to: "+5491112345678",
      bodyText: "Hola",
      apiKey: "KEY",
      fromNumber: "+12025550100",
    });
    expect(r).toEqual({ ok: true, providerId: "msg-telnyx-1" });
  });

  it("error HTTP", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        statusText: "Bad Request",
        json: async () => ({ errors: [{ detail: "invalid from" }] }),
      })) as unknown as typeof fetch,
    );
    const r = await sendSmsViaTelnyxHttp({
      to: "+5491112345678",
      bodyText: "Hola",
      apiKey: "KEY",
      fromNumber: "+12025550100",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("invalid");
  });
});
