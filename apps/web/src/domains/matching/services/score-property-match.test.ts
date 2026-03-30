import { describe, expect, it } from "vitest";
import {
  MATCHING_SCORE_CASES,
  scoreBedroomsDimension,
  scorePriceDimension,
  scorePropertyAgainstProfile,
  scoreZoneDimension,
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

describe("dimensiones sueltas (matching v0)", () => {
  it("scorePriceDimension: 0 si el precio supera el máximo del perfil", () => {
    expect(scorePriceDimension(null, 200000, 250000)).toBe(0);
  });

  it("scorePriceDimension: puntaje pleno dentro del rango", () => {
    expect(scorePriceDimension(100000, 300000, 200000)).toBe(20);
  });

  it("scoreZoneDimension: coincidencia exacta de zona", () => {
    expect(scoreZoneDimension("Palermo", "palermo")).toBe(20);
  });

  it("scoreBedroomsDimension: al menos los dormitorios pedidos", () => {
    expect(scoreBedroomsDimension(2, 3)).toBe(20);
  });

  it("scoreBedroomsDimension: un dormitorio menos da puntaje parcial", () => {
    expect(scoreBedroomsDimension(3, 2)).toBe(10);
  });
});
