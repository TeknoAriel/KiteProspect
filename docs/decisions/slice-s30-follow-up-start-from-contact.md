# S30 — Iniciar seguimiento desde ficha de contacto (F1-E12)

**Fecha:** 2026-04-02  
**Ref roadmap:** F1-E12 (secuencias simples).

## Contexto

El motor `processDueFollowUps` y el cron ya existían; las secuencias solo se creaban en seed (`seed-demo-showcase.ts`). Sin alta desde producto, el flujo no era operable para leads reales.

## Decisión

1. **Dominio:** `startFollowUpSequenceForContact` — valida contacto y plan (`accountId`), rechaza si ya hay secuencia `active` para el contacto, exige `sequence` JSON con al menos un paso (`parsePlanSequence`), crea `FollowUpSequence` con `nextAttemptAt = now()` para que el cron pueda tomarla en la próxima ventana.
2. **API:** `POST /api/contacts/[id]/follow-up-sequences` con `{ followUpPlanId }`; solo **admin / coordinador** (mismo criterio que pausar/reanudar).
3. **Auditoría:** `follow_up_sequence_started` con `contactId`, `followUpPlanId`, `planName`, `stepsCount`, `maxAttempts`.
4. **UI:** ficha contacto — selector de plan activo + “Iniciar seguimiento”; lista de secuencias recientes con pausa/reanudación (`FollowUpSequenceControls`) e **historial de intentos** (`FollowUpAttempt`, últimos 20 por secuencia).

## Plan de trabajo (rápido, orden sugerido)

| Orden | Tarea | Estado |
|-------|--------|--------|
| 1 | Servicio `startFollowUpSequenceForContact` + tests manuales vía API | [x] |
| 2 | `POST` autenticado + errores 404/409/400 | [x] |
| 3 | Formulario cliente + `router.refresh()` | [x] |
| 4 | Incluir intentos en query ficha + bloque UI | [x] |
| 5 | `npm run verify` + documentación | [x] |

## Pendiente (no bloqueante)

- Botón “Ejecutar batch ahora” (admin) que llame al mismo handler que el cron, para pruebas sin esperar el schedule diario en Vercel Hobby (`docs/decisions/vercel-hobby-cron-daily-kiteprop-feed.md`).
- Múltiples secuencias no activas / reglas de negocio más finas (Fase 2).

## Referencias

- `apps/web/src/domains/followups/services/start-follow-up-sequence.ts`
- `apps/web/src/app/api/contacts/[id]/follow-up-sequences/route.ts`
- `apps/web/src/app/dashboard/contacts/[id]/start-follow-up-sequence-form.tsx`
- `apps/web/src/domains/followups/services/process-due-follow-ups.ts`
