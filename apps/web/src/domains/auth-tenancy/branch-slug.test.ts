import { describe, expect, it } from "vitest";
import { slugifyBranchName } from "./branch-slug";

describe("slugifyBranchName", () => {
  it("normalizes accents and spaces", () => {
    expect(slugifyBranchName("  Palermo Norte  ")).toBe("palermo-norte");
  });

  it("fallback when empty", () => {
    expect(slugifyBranchName("!!!")).toBe("sucursal");
  });
});
