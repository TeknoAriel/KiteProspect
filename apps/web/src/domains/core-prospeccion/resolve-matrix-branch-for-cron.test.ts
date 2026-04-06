import { describe, expect, it } from "vitest";
import { resolveMatrixBranchForCron } from "./resolve-matrix-branch-for-cron";

describe("resolveMatrixBranchForCron", () => {
  it("sin lock usa inferida", () => {
    expect(
      resolveMatrixBranchForCron({
        sequenceLocked: false,
        sequenceBranchKey: "low_response",
        inferred: "high_match",
      }),
    ).toBe("high_match");
  });

  it("con lock usa la guardada", () => {
    expect(
      resolveMatrixBranchForCron({
        sequenceLocked: true,
        sequenceBranchKey: "good_response",
        inferred: "high_match",
      }),
    ).toBe("good_response");
  });

  it("con lock y sin key devuelve null", () => {
    expect(
      resolveMatrixBranchForCron({
        sequenceLocked: true,
        sequenceBranchKey: null,
        inferred: "high_match",
      }),
    ).toBe(null);
  });
});
