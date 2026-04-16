/** Pesos fijados en arquitectura (sin IA en esta fase). */
export const ACTIVATION_SCORE_WEIGHTS: ScoreWeights = {
  intent: 0.3,
  readiness: 0.2,
  fit: 0.3,
  engagement: 0.2,
};

export type ScoreWeights = {
  intent: number;
  readiness: number;
  fit: number;
  engagement: number;
};

export function combineScores(
  intent: number,
  readiness: number,
  fit: number,
  engagement: number,
  weights: ScoreWeights = ACTIVATION_SCORE_WEIGHTS,
): number {
  const raw =
    intent * weights.intent +
    readiness * weights.readiness +
    fit * weights.fit +
    engagement * weights.engagement;
  return Math.min(100, Math.max(0, Math.round(raw)));
}
