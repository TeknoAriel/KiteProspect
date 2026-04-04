import { describe, expect, it } from "vitest";
import { selectPreferredSearchProfile } from "./search-profile-preference";

function p(source: string, updatedAt: string) {
  return { source, updatedAt: new Date(updatedAt) };
}

describe("selectPreferredSearchProfile", () => {
  it("prefiere declared sobre inferred aunque inferred sea más nuevo", () => {
    const profiles = [p("inferred", "2025-01-02"), p("declared", "2025-01-01")];
    expect(selectPreferredSearchProfile(profiles)?.source).toBe("declared");
  });

  it("si solo inferred, lo usa", () => {
    const profiles = [p("inferred", "2025-01-01")];
    expect(selectPreferredSearchProfile(profiles)?.source).toBe("inferred");
  });

  it("el declared más reciente si hay varios", () => {
    const profiles = [p("declared", "2025-01-01"), p("declared", "2025-01-03")];
    expect(selectPreferredSearchProfile(profiles)?.updatedAt.toISOString().slice(0, 10)).toBe("2025-01-03");
  });
});
