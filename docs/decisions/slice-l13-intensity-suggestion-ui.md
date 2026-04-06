# Slice L13 — Hint de intensidad sugerida en ficha (rama vs plan)

**Fecha:** 2026-04-06  
**Referencias:** `suggestNextIntensityAfterBranch()` en `follow-up-intensity-normalize.ts`, `docs/diferencias-vs-implementacion-actual.md`.

## Contexto

La función de producto ya existía y **no** persistía cambios. Faltaba visibilidad en la ficha de contacto.

## Decisión

- Componente **solo lectura** `FollowUpIntensitySuggestion` en la sección de seguimiento automático: si hay `matrixBranchKey` válido y la sugerencia difiere de la intensidad normalizada del plan, se muestra un texto que orienta a editar planes en `/dashboard/account/follow-up-plans` (sin mutar datos).

## Consecuencias

- No sustituye política de motor automático; el operador decide cuándo cambiar de plan.
