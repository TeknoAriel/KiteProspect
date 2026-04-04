import { describe, expect, it } from "vitest";
import { inferSearchProfileFromText } from "./infer-search-profile-heuristics";

describe("inferSearchProfileFromText", () => {
  it("detecta compra y departamento", () => {
    const r = inferSearchProfileFromText("Hola busco comprar un departamento en Palermo, 2 dorm, hasta 150 mil");
    expect(r.fields.intent).toBe("compra");
    expect(r.fields.propertyType).toBe("departamento");
    expect(r.fields.zone).toMatch(/Palermo/i);
    expect(r.fields.bedrooms).toBe(2);
    expect(r.fields.maxPrice).toBe(150_000);
    expect(r.confidence).toBeGreaterThan(0.3);
  });

  it("detecta renta", () => {
    const r = inferSearchProfileFromText("Necesito alquiler temporal en Córdoba capital");
    expect(r.fields.intent).toBe("renta");
    expect(r.signals.length).toBeGreaterThan(0);
  });

  it("texto vacío sin señales fuertes", () => {
    const r = inferSearchProfileFromText("   ");
    expect(r.signals.length).toBe(0);
    expect(r.confidence).toBe(0);
  });
});
