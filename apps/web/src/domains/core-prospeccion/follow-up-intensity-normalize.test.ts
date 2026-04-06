import { describe, expect, it } from "vitest";
import {
  normalizePlanIntensity,
  suggestNextIntensityAfterBranch,
} from "./follow-up-intensity-normalize";

describe("follow-up-intensity-normalize", () => {
  it("normaliza legacy y oficial", () => {
    expect(normalizePlanIntensity("low")).toBe("soft");
    expect(normalizePlanIntensity("medium")).toBe("normal");
    expect(normalizePlanIntensity("high")).toBe("strong");
    expect(normalizePlanIntensity("soft")).toBe("soft");
    expect(normalizePlanIntensity("priority")).toBe("priority");
  });

  it("sugiere subida con buena respuesta", () => {
    expect(suggestNextIntensityAfterBranch("good_response", "soft")).toBe("normal");
    expect(suggestNextIntensityAfterBranch("good_response", "normal")).toBe("strong");
    expect(suggestNextIntensityAfterBranch("good_response", "strong")).toBe("priority");
  });

  it("sugiere bajada sin respuesta", () => {
    expect(suggestNextIntensityAfterBranch("no_response", "priority")).toBe("strong");
    expect(suggestNextIntensityAfterBranch("no_response", "soft")).toBeNull();
  });
});
