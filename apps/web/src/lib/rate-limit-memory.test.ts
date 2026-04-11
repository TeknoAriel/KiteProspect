import { describe, expect, it } from "vitest";
import { allowRateLimitWithConfig } from "./rate-limit-memory";

describe("allowRateLimitWithConfig", () => {
  it("permite hasta max en la ventana", () => {
    const cfg = { windowMs: 60_000, max: 3 };
    const k = `test-${Math.random()}`;
    expect(allowRateLimitWithConfig(k, cfg)).toBe(true);
    expect(allowRateLimitWithConfig(k, cfg)).toBe(true);
    expect(allowRateLimitWithConfig(k, cfg)).toBe(true);
    expect(allowRateLimitWithConfig(k, cfg)).toBe(false);
  });
});
