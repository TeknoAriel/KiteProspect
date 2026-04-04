import { describe, expect, it } from "vitest";
import { mean, median } from "./stats-median";

describe("mean", () => {
  it("returns null for empty", () => {
    expect(mean([])).toBeNull();
  });
  it("averages", () => {
    expect(mean([2, 4])).toBe(3);
  });
});

describe("median", () => {
  it("returns null for empty", () => {
    expect(median([])).toBeNull();
  });
  it("odd length", () => {
    expect(median([3, 1, 2])).toBe(2);
  });
  it("even length", () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });
});
