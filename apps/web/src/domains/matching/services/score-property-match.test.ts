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
    expect(scorePriceDimension(null, 200000, 250000, 20)).toBe(0);
  });

  it("scorePriceDimension: puntaje pleno dentro del rango", () => {
    expect(scorePriceDimension(100000, 300000, 200000, 20)).toBe(20);
  });

  it("scoreZoneDimension: coincidencia exacta de zona", () => {
    expect(scoreZoneDimension("Palermo", "palermo", 20)).toBe(20);
  });

  it("scoreBedroomsDimension: al menos los dormitorios pedidos", () => {
    expect(scoreBedroomsDimension(2, 3, 20)).toBe(20);
  });

  it("scoreBedroomsDimension: un dormitorio menos da puntaje parcial", () => {
    expect(scoreBedroomsDimension(3, 2, 20)).toBe(10);
  });

  it("pesos personalizados: solo importa zona cuando el resto tiene peso 0", () => {
    const zoneOnly = { intent: 0, type: 0, zone: 100, price: 0, bedrooms: 0 } as const;
    const { score: mismatch } = scorePropertyAgainstProfile(
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
        zone: "Belgrano",
        price: 400000,
        bedrooms: 2,
        status: "available",
      },
      { weights: zoneOnly },
    );
    const { score: match } = scorePropertyAgainstProfile(
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
        price: 400000,
        bedrooms: 2,
        status: "available",
      },
      { weights: zoneOnly },
    );
    expect(mismatch).toBeLessThan(30);
    expect(match).toBeGreaterThan(80);
  });
});
