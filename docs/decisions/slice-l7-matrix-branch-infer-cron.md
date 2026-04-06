# Decisión: inferencia v1 de rama de matriz en cron de seguimiento

**Fecha:** 2026-04-04  
**Estado:** Aceptada

## Contexto

El producto define **6 ramas** automáticas; `FollowUpSequence.matrixBranchKey` existía como campo opcional sin cálculo automático.

## Decisión

1. Función pura `inferFollowUpMatrixBranch()` en `infer-follow-up-matrix-branch.ts` con umbrales conservadores (p. ej. match alto ≥ 72).
2. En cada ejecución de `processDueFollowUps`, antes del intento: lectura de mejor `PropertyMatch`, conteo y perfiles de búsqueda; se persiste `matrixBranchKey` en la secuencia al avanzar paso.
3. Cada `FollowUpAttempt` incluye `metadata.branchInferred` cuando aplica.
4. UI ficha: etiquetas ES (`FOLLOW_UP_BRANCH_LABEL_ES`) y detalle “Dato a obtener” desde `metadata.matrix`.

## Límites

- `no_response`: último mensaje del hilo es outbound y antiguo (`FOLLOW_UP_NO_RESPONSE_HOURS`, default 48). Si el último mensaje es inbound, no aplica.
- Re-evaluación en cada paso del cron: la rama puede cambiar si mejora el match o el perfil.

## Referencias

- `docs/seguimiento-y-cualificacion.md`
- `docs/diferencias-vs-implementacion-actual.md`
