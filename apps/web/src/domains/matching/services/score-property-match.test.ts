import { describe, expect, it } from "vitest";
import {
  MATCHING_SCORE_CASES,
  scorePropertyAgainstProfile,
} from "./score-property-match";

describe("scorePropertyAgainstProfile (matching v0)", () => {
  it("documenta casos de referencia dentro del rango esperado", () => {
    for (const c of MATCHING_SCORE_CASES) {
      const { score } = scorePropertyAgainstProfile(c.profile, c.property);
      expect(score, c.name).toBeGreaterThanOrEqual(c.minExpected);
      expect(score, c.name).toBeLessThanOrEqual(c.maxExpected);
    }
  });

  it("devuelve 0 si la propiedad no está disponible", () => {
    const { score, reason } = scorePropertyAgainstProfile(
      {
        intent: "compra",
        propertyType: "departamento",
        zone: "Palermo",
        minPrice: null,
        maxPrice: 500000,
        bedrooms: 2,
      },
      {
        type: "departamento",
        intent: "venta",
        zone: "Palermo",
        price: 100000,
        bedrooms: 2,
        status: "withdrawn",
      },
    );
    expect(score).toBe(0);
    expect(reason).toContain("no está disponible");
  });

  it("penaliza inversión vs intención alineada pero mantiene puntos", () => {
    const { score } = scorePropertyAgainstProfile(
      {
        intent: "inversión",
        propertyType: "departamento",
        zone: "Caballito",
        minPrice: null,
        maxPrice: 300000,
        bedrooms: 1,
      },
      {
        type: "departamento",
        intent: "venta",
        zone: "Caballito",
        price: 250000,
        bedrooms: 2,
        status: "available",
      },
    );
    expect(score).toBeGreaterThan(50);
    expect(score).toBeLessThan(100);
  });
});
