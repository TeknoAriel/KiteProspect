import { describe, expect, it } from "vitest";
import { normalizeMetaLeadPageId } from "./meta-lead-page-id";

describe("normalizeMetaLeadPageId", () => {
  it("acepta id numérico típico", () => {
    expect(normalizeMetaLeadPageId("  123456789012345  ")).toBe("123456789012345");
  });

  it("rechaza corto o no numérico", () => {
    expect(normalizeMetaLeadPageId("12345")).toBe(null);
    expect(normalizeMetaLeadPageId("abc")).toBe(null);
  });
});
