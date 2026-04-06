# Seguimiento y cualificación (núcleo oficial)

**Regla central:** no usar secuencias ciegas solo por cantidad de intentos. Cada toque debe tener **objetivo**, **dato a obtener** y **siguiente acción** coherentes con la matriz; el sistema pide solo lo que falta y evoluciona según respuesta (motor completo de ramas: en evolución).

**Implementación:** `apps/web/src/domains/core-prospeccion/follow-up-official-matrix.ts`, `follow-up-intensity-normalize.ts`, cron `process-due-follow-ups.ts`, `FollowUpSequence.matrixCoreStageKey`.

## Intensidades oficiales (4)

| Clave | UI | Máx. contactos (default) |
|-------|-----|---------------------------|
| `soft` | Suave | 4 |
| `normal` | Normal | 6 |
| `strong` | Fuerte | 8 |
| `priority` | Prioritario | 10 |

- `FollowUpPlan.maxAttempts` y la longitud del JSON `sequence` siguen siendo configurables por cuenta; los números anteriores son **defaults de producto** (`INTENSITY_DEFAULT_MAX_ATTEMPTS`).
- Valores legacy `low` / `medium` / `high` se **normalizan** a `soft` / `normal` / `strong` al guardar y al mostrar (`normalizePlanIntensity`).

## Etapas del núcleo (6)

| Clave | Nombre UI |
|-------|-----------|
| `activation` | Activación |
| `focus` | Enfoque |
| `qualification` | Cualificación |
| `refinement` | Afinado |
| `conversion` | Conversión |
| `reactivation` | Reactivación |

## Regla por contacto / secuencia activa

Para cada intento de seguimiento automático el sistema persiste y/o muestra:

| Campo | Dónde |
|-------|--------|
| Etapa del núcleo | `FollowUpSequence.matrixCoreStageKey` (próximo paso pendiente o última al cerrar) |
| Objetivo | `FollowUpAttempt.objective` (JSON del plan o texto de matriz si `objective` vacío) |
| Dato a obtener / siguiente acción | `FollowUpAttempt.metadata.matrix` (`dataToObtainEs`, `nextActionHintEs`, `coreStageKey`) |
| Canal principal | `FollowUpAttempt.channel` |
| Outcome | `FollowUpAttempt.outcome` (`sent`, `failed`, `manual`, etc.) |
| Rama (evolutivo) | `FollowUpSequence.matrixBranchKey` (opcional; reservado para motor de ramas) |

## Matriz SUAVE (4 pasos)

| # | Etapa | Objetivo (resumen) |
|---|--------|---------------------|
| 1 | Activación | Confirmar interés |
| 2 | Enfoque | Operación / tipo |
| 3 | Cualificación | Zona o rango (ligera) |
| 4 | Reactivación / cierre | Reactivable o subir a Normal |

## Matriz NORMAL (6 pasos)

| # | Etapa | Objetivo (resumen) |
|---|--------|---------------------|
| 1 | Activación | Confirmar interés |
| 2 | Enfoque | Operación / tipo / propiedad puntual o abierta |
| 3 | Enfoque | Zona ideal y aceptable |
| 4 | Cualificación | Rango |
| 5 | Cualificación | Timing + bloqueo |
| 6 | Conversión / seguimiento | Asesor, opciones, seguir viendo |

## Matriz FUERTE (8 pasos)

| # | Etapa | Objetivo (resumen) |
|---|--------|---------------------|
| 1 | Activación | Confirmar continuidad |
| 2 | Enfoque | Operación / tipo / zona |
| 3–5 | Cualificación | Presupuesto, timing, bloqueo |
| 6 | Afinado | Flexibilidad / zona / alternativas |
| 7 | Conversión | Llamada / visita / asesor / ficha |
| 8 | Reactivación | Opción nueva o afinada |

## Matriz PRIORITARIO (10 pasos)

| # | Etapa | Objetivo (resumen) |
|---|--------|---------------------|
| 1 | Activación | Inmediata |
| 2 | Enfoque | Exacto |
| 3–5 | Cualificación | Presupuesto, timing, bloqueo reales |
| 6 | Afinado | — |
| 7 | Conversión | Opciones concretas |
| 8 | Conversión | Acción humana |
| 9 | Reactivación | Inteligente |
| 10 | Conversión | Cierre operativo |

(Texto canónico por paso en código: `follow-up-official-matrix.ts`.)

## Ramas automáticas (6) y cambio de intensidad

Claves: `no_response`, `low_response`, `good_response`, `blocked_lead`, `high_match`, `no_match_now`.

**Inferencia v1 (cron):** en cada paso de `processDueFollowUps` se calcula una rama probable con `inferFollowUpMatrixBranch()` (mejor match, conteo, perfil, etapas, **último mensaje del hilo**). Se guarda en `FollowUpSequence.matrixBranchKey` e `metadata.branchInferred` en el intento. **`no_response`:** último mensaje global del contacto es **saliente** y tiene más de `FOLLOW_UP_NO_RESPONSE_HOURS` (default 48) sin un entrante posterior.

**Salto de pasos (matriz vs perfil):** antes de ejecutar un intento, el cron puede avanzar `currentStep` sin crear intentos intermedios si `SearchProfile` + `declaredProfile` ya cubren la etapa (`advancePastSkippableSteps`). Auditoría `follow_up_matrix_steps_skipped`. Variable `FOLLOW_UP_MATRIX_SKIP_ENABLED` (default activo si no es `false`).

**Sugerencia** de siguiente intensidad (producto, no persistida automáticamente aún): `suggestNextIntensityAfterBranch()` en `follow-up-intensity-normalize.ts`. El motor futuro debe crear nueva secuencia o mutar plan según política del tenant.

## Sugerencia de propiedades

- Conversación temprana: hasta **3** (`PROPERTY_SUGGESTIONS_EARLY_MAX`).
- Buen match: hasta **5** (`PROPERTY_SUGGESTIONS_STRONG_MAX`).
- Enlaces: inventario del tenant (feed KiteProp o otro, p. ej. Propieya); ver `docs/integracion-kiteprop-propieya.md`.

## Información comercial objetivo

Intención, urgencia, capacidad/presupuesto, zona, tipo/requisitos, bloqueos — alineado a `SearchProfile`, scoring y reglas en `docs/product-rules.md`.
