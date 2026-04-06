# Slice L12 — Rama de matriz fijada manualmente (no pisar en cron)

**Fecha:** 2026-04-06  
**Referencias:** `docs/diferencias-vs-implementacion-actual.md` (motor de ramas), L7 cron inferencia.

## Contexto

El cron infería `FollowUpSequence.matrixBranchKey` en cada paso y **sobrescribía** el valor, sin forma de “congelar” una rama acordada por el equipo comercial.

## Decisión

1. **Modelo:** `FollowUpSequence.matrixBranchLocked` (`Boolean`, default `false`). Si es `true`, el cron **no** sustituye `matrixBranchKey` por `inferFollowUpMatrixBranch`; usa el valor guardado (o `null` si no hay clave).

2. **Resolución:** `resolveMatrixBranchForCron()` en `resolve-matrix-branch-for-cron.ts` (tests Vitest).

3. **Metadata de intento:** si la rama es manual → `branchManual` + `branchLocked: true`; si es inferida → `branchInferred` (como antes).

4. **API:** `PATCH /api/follow-up-sequences/[id]` acepta `matrixBranchKey` (rama válida de `FOLLOW_UP_BRANCH_KEYS`), `matrixBranchLocked`, y sigue aceptando `status`. Auditoría `follow_up_matrix_branch_manual_update`.

5. **UI:** ficha contacto — selector de rama, “Guardar y fijar”, “Volver a automático” (`matrixBranchLocked: false`).

## Consecuencias

- Cambios en el contrato de `PATCH` deben mantener compatibilidad con clientes que solo envían `status`.
