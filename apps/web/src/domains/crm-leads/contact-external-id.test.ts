import { describe, expect, it } from "vitest";
import { normalizeContactExternalId } from "./contact-external-id";

describe("normalizeContactExternalId", () => {
  it("null borra", () => {
    expect(normalizeContactExternalId(null)).toEqual({ ok: true, value: null });
  });

  it("string vacío o solo espacios → null", () => {
    expect(normalizeContactExternalId("")).toEqual({ ok: true, value: null });
    expect(normalizeContactExternalId("  ")).toEqual({ ok: true, value: null });
  });

  it("recorta y acepta", () => {
    expect(normalizeContactExternalId("  crm-123  ")).toEqual({ ok: true, value: "crm-123" });
  });

  it("rechaza undefined y tipo incorrecto", () => {
    expect(normalizeContactExternalId(undefined).ok).toBe(false);
    expect(normalizeContactExternalId(1).ok).toBe(false);
  });

  it("rechaza demasiado largo", () => {
    const long = "a".repeat(257);
    expect(normalizeContactExternalId(long).ok).toBe(false);
  });
});
