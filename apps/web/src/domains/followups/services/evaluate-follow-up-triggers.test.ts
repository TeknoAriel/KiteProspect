import { describe, expect, it } from "vitest";
import { evaluateFollowUpTriggers } from "./evaluate-follow-up-triggers";

describe("evaluateFollowUpTriggers", () => {
  it("sin triggers acepta siempre", () => {
    expect(
      evaluateFollowUpTriggers(null, {
        commercialStage: "exploratory",
        conversationalStage: "new",
        totalScore: null,
      }),
    ).toEqual({ ok: true });
  });

  it("minTotalScore bloquea si el score es bajo", () => {
    const r = evaluateFollowUpTriggers(
      { minTotalScore: 50 },
      {
        commercialStage: "prospect",
        conversationalStage: "answered",
        totalScore: 30,
      },
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("minTotalScore");
  });

  it("commercialStageIn permite si coincide", () => {
    const r = evaluateFollowUpTriggers(
      { commercialStageIn: ["prospect", "hot"] },
      {
        commercialStage: "hot",
        conversationalStage: "new",
        totalScore: 80,
      },
    );
    expect(r).toEqual({ ok: true });
  });
});
