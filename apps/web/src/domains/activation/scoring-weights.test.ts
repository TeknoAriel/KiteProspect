import { describe, expect, it } from "vitest";
import { ACTIVATION_SCORE_WEIGHTS, combineScores } from "./scoring-weights";

describe("combineScores", () => {
  it("aplica pesos de activación (0.3/0.2/0.3/0.2)", () => {
    const t = combineScores(80, 40, 80, 80, ACTIVATION_SCORE_WEIGHTS);
    expect(t).toBe(
      Math.round(
        80 * 0.3 + 40 * 0.2 + 80 * 0.3 + 80 * 0.2,
      ),
    );
  });
});
