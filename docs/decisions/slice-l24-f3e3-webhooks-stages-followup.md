# L24 / F3-E3 — Webhooks: etapas de contacto e inicio de secuencia

**Fecha:** 2026-04-01  
**Estado:** implementado.

## Contexto

`slice-l14-f3e3-public-webhooks.md` dejó **eventos v1** con `lead.captured` y `contact.assignment_changed`. Operaciones frecuentes en CRM son el **cambio de etapas** (comercial/conversacional) y el **arranque de una secuencia de seguimiento**; integraciones externas deben poder reaccionar sin polling.

## Decisión

1. **Nuevos tipos** en `WEBHOOK_EVENT_TYPES` (fuente única para API, UI y emisión):
   - `contact.stages_updated` — cuando un `PATCH` a `/api/contacts/[id]` altera de hecho `commercialStage` y/o `conversationalStage` (no se emite si el valor enviado coincide con el existente).
   - `follow_up.sequence_started` — tras crear secuencia y auditoría `follow_up_sequence_started` en `startFollowUpSequenceForContact`.

2. **Payload `contact.stages_updated`:** `data` incluye `contactId`, `before` y `after` con `{ commercialStage, conversationalStage }` (strings de dominio ya validados; sin PII adicional).

3. **Payload `follow_up.sequence_started`:** `data` con `contactId`, `followUpSequenceId`, `followUpPlanId`.

4. **Entrega:** misma política que L14 (`emitAccountWebhooks`, no bloquea la petición principal; suscripciones filtran por `events`).

5. **Persistencia:** migración que amplía el **default** JSON de `WebhookSubscription.events` para nuevas filas; suscripciones existentes conservan su array guardado hasta que el admin los edite.

## Alternativas descartadas

- Emitir `contact.stages_updated` aunque el valor no cambie (ruido para el receptor).
- Incluir nombres de etapa legibles en el webhook: el contrato MVP usa los mismos identificadores de string que el API.

## Referencias

- `apps/web/src/domains/integrations/services/webhook-event-types.ts`
- `apps/web/src/app/api/contacts/[id]/route.ts`
- `apps/web/src/domains/followups/services/start-follow-up-sequence.ts`
