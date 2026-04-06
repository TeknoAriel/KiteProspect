# Decisión: salto de pasos según matriz y perfil (cron)

**Fecha:** 2026-04-04  
**Estado:** Aceptada

## Contexto

El producto pide no avanzar en secuencia “ciega” cuando el contacto ya aportó datos equivalentes a la etapa del núcleo.

## Decisión

1. Módulo `follow-up-matrix-step-skip.ts`: `shouldSkipCoreStage` + `advancePastSkippableSteps` por intensidad oficial.
2. Heurística v1:
   - **activation:** omitir si `conversationalStage !== "new"`.
   - **focus:** omitir si hay intención y (zona o tipología).
   - **qualification:** omitir si intención + rango de precio + (dormitorios o timing en `declaredProfile`).
   - **refinement:** omitir si intención + zona + precio + dormitorios.
   - **conversion / reactivación:** no omitir.
3. `processDueFollowUps`: antes de crear intento, avanza `currentStep` sin incrementar `attempts`; auditoría `follow_up_matrix_steps_skipped` si hubo saltos.
4. Kill switch: `FOLLOW_UP_MATRIX_SKIP_ENABLED=false` desactiva el salto (default distinto de `false` = activo).

## Referencias

- `docs/diferencias-vs-implementacion-actual.md`
- `docs/seguimiento-y-cualificacion.md`
