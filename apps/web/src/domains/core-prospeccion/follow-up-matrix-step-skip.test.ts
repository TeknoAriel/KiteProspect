import { describe, expect, it } from "vitest";
import { advancePastSkippableSteps, shouldSkipCoreStage } from "./follow-up-matrix-step-skip";

describe("follow-up-matrix-step-skip", () => {
  it("omite activación si ya no es new", () => {
    expect(
      shouldSkipCoreStage("activation", {
        conversationalStage: "answered",
        searchProfiles: [],
        declaredProfile: null,
      }),
    ).toBe(true);
  });

  it("no omite conversión", () => {
    expect(
      shouldSkipCoreStage("conversion", {
        conversationalStage: "profiled_useful",
        searchProfiles: [
          {
            intent: "compra",
            zone: "CABA",
            propertyType: "departamento",
            minPrice: null,
            maxPrice: null,
            bedrooms: 2,
          },
        ],
        declaredProfile: {},
      }),
    ).toBe(false);
  });

  it("avanza varios índices si el perfil cubre etapas", () => {
    const ctx = {
      conversationalStage: "identified",
      searchProfiles: [
        {
          intent: "compra",
          zone: "Palermo",
          propertyType: "departamento",
          minPrice: 100000,
          maxPrice: 200000,
          bedrooms: 2,
        },
      ],
      declaredProfile: { timing: "este mes" },
    };
    const r = advancePastSkippableSteps("normal", 6, 0, ctx);
    expect(r.skipped).toBeGreaterThan(0);
    expect(r.nextIndex).toBeGreaterThan(0);
  });
});
