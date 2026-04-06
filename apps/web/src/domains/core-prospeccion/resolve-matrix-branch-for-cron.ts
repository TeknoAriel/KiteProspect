import type { FollowUpBranchKey } from "./follow-up-branches";

/**
 * Rama usada en el cron: si la secuencia tiene rama fijada manualmente, no se usa la inferida.
 */
export function resolveMatrixBranchForCron(params: {
  sequenceLocked: boolean;
  sequenceBranchKey: string | null;
  inferred: FollowUpBranchKey | null;
}): FollowUpBranchKey | null {
  if (params.sequenceLocked) {
    const k = params.sequenceBranchKey;
    if (k == null || k === "") return null;
    return k as FollowUpBranchKey;
  }
  return params.inferred;
}
