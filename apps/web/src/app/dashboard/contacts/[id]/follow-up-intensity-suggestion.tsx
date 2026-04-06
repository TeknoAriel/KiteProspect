import {
  FOLLOW_UP_INTENSITY_LABEL_ES,
  type FollowUpIntensityKey,
} from "@/domains/core-prospeccion/follow-up-intensity";
import {
  normalizePlanIntensity,
  suggestNextIntensityAfterBranch,
} from "@/domains/core-prospeccion/follow-up-intensity-normalize";
import { isFollowUpBranchKey } from "@/domains/core-prospeccion/follow-up-branches";

/**
 * Hint de producto: siguiente intensidad sugerida por rama (no persiste ni cambia planes).
 */
export function FollowUpIntensitySuggestion({
  matrixBranchKey,
  planIntensity,
}: {
  matrixBranchKey: string | null;
  planIntensity: string;
}) {
  if (!matrixBranchKey || !isFollowUpBranchKey(matrixBranchKey)) {
    return null;
  }
  const current = normalizePlanIntensity(planIntensity);
  const suggested = suggestNextIntensityAfterBranch(matrixBranchKey, current);
  if (suggested === null) {
    return null;
  }
  if (suggested === current) {
    return null;
  }
  const cur = current as FollowUpIntensityKey;
  const sug = suggested as FollowUpIntensityKey;
  return (
    <p
      style={{
        margin: "0.35rem 0 0",
        fontSize: "0.75rem",
        color: "#555",
        lineHeight: 1.45,
        maxWidth: "36rem",
      }}
    >
      Sugerencia de producto (no cambia el plan sola): con esta rama, conviene pasar de intensidad{" "}
      <strong>{FOLLOW_UP_INTENSITY_LABEL_ES[cur]}</strong> a <strong>{FOLLOW_UP_INTENSITY_LABEL_ES[sug]}</strong>. Ajustá
      el plan en <code>/dashboard/account/follow-up-plans</code> o iniciá otro plan si aplica.
    </p>
  );
}
