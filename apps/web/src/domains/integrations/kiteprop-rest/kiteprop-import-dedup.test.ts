import { describe, expect, it } from "vitest";
import { buildKitepropRestIdempotencyKey } from "./kiteprop-import-dedup";

describe("buildKitepropRestIdempotencyKey", () => {
  it("prioriza externalMessageId", () => {
    const k = buildKitepropRestIdempotencyKey("acc", {
      externalMessageId: "m1",
      externalLeadId: "l1",
      occurredAt: new Date(),
      raw: {},
    });
    expect(k).toBe("msg:m1");
  });

  it("usa lead si no hay mensaje", () => {
    const k = buildKitepropRestIdempotencyKey("acc", {
      externalLeadId: "l9",
      occurredAt: new Date(),
      raw: {},
    });
    expect(k).toBe("lead:l9");
  });
});
