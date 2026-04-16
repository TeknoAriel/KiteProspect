import { describe, expect, it } from "vitest";
import { normalizeKitepropApiItem } from "./normalize-kiteprop-api-item";

describe("normalizeKitepropApiItem", () => {
  it("mapea lead plano con email", () => {
    const n = normalizeKitepropApiItem({
      id: "L1",
      email: "a@b.com",
      phone: "+5491112345678",
      body: "Hola",
      created_at: "2026-04-01T12:00:00.000Z",
    });
    expect(n?.externalLeadId).toBe("L1");
    expect(n?.email).toBe("a@b.com");
    expect(n?.messageBody).toBe("Hola");
  });

  it("anida contact y property", () => {
    const n = normalizeKitepropApiItem({
      id: "L2",
      contact: { id: "C9", email: "x@y.com" },
      property: { id: "P1", source: "kiteprop" },
      message: { body: "Consulta", created_at: "2026-04-02T10:00:00.000Z" },
    });
    expect(n?.externalContactId).toBe("C9");
    expect(n?.propertyExternalId).toBe("P1");
  });

  it("acepta ids numéricos y property_id numérico (REST KiteProp)", () => {
    const n = normalizeKitepropApiItem({
      id: 42,
      email: "a@b.com",
      body: "Hola",
      property_id: 999,
      created_at: "2026-04-01T12:00:00.000Z",
    });
    expect(n?.externalLeadId).toBe("42");
    expect(n?.propertyExternalId).toBe("999");
  });

  it("mapea contacto general: first_name, last_name, summary", () => {
    const n = normalizeKitepropApiItem({
      id: 7,
      first_name: "Ana",
      last_name: "García",
      email: "ana@example.com",
      summary: "Consulta sin ficha",
      source: "Web Avalon",
    });
    expect(n?.name).toBe("Ana García");
    expect(n?.messageBody).toBe("Consulta sin ficha");
  });
});
