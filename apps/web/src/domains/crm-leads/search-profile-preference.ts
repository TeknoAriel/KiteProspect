/**
 * Prioridad de perfil para matching y scoring: **declarado** sobre **inferido** (F2-E1).
 * Dentro de cada fuente, el más reciente por `updatedAt`.
 */
export type WithSourceAndUpdated = {
  source: string;
  updatedAt: Date;
};

export function selectPreferredSearchProfile<T extends WithSourceAndUpdated>(
  profiles: T[],
): T | null {
  if (profiles.length === 0) return null;
  const byUpdated = (a: T, b: T) => b.updatedAt.getTime() - a.updatedAt.getTime();

  const declared = profiles.filter((p) => p.source === "declared").sort(byUpdated);
  if (declared.length > 0) return declared[0]!;

  const inferred = profiles.filter((p) => p.source === "inferred").sort(byUpdated);
  if (inferred.length > 0) return inferred[0]!;

  return [...profiles].sort(byUpdated)[0] ?? null;
}
