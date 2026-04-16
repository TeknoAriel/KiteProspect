import { describe, expect, it } from "vitest";
import { resolveKitepropHandoffUrl } from "./resolve-kiteprop-handoff-config";

describe("resolveKitepropHandoffUrl", () => {
  it("prioriza config de tenant", () => {
    const u = resolveKitepropHandoffUrl({
      slug: "demo",
      config: { kitepropHandoffUrl: "https://crm.example/handoff" },
    });
    expect(u).toBe("https://crm.example/handoff");
  });
});
