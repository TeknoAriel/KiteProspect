# L22 — F3-E1+ Puente CRM (resolve por `externalId` + webhook)

## Contexto

`PRODUCT_DEFINITION.md` Fase 3 incluye CRM externo; **L18** ya entregó `Contact.externalId` + `PATCH` autenticado. Falta un paso **acotado** para orquestación server-side sin elegir un CRM comercial concreto.

## Decisión

1. **`GET /api/contacts/resolve-external`** — query `externalId` (obligatorio, no vacío) + `accountSlug` o `accountId`; autenticación idéntica a captura (`CAPTURE_API_SECRET` global o `kp_…`); rate limit por IP (misma familia que `PATCH …/external`). Respuesta mínima: `id`, `externalId`, `commercialStage`, `conversationalStage`, `branchId`.
2. **Webhook** `contact.external_id_updated` — se emite tras cambio real de `externalId` vía `PATCH` (sesión admin/coordinador o captura), con `contactId`, `externalIdBefore`, `externalIdAfter` (pueden ser `null` al borrar).
3. **Tipos y BD** — `WEBHOOK_EVENT_TYPES` + default en `WebhookSubscription.events` para **nuevas** suscripciones (filas existentes conservan su array hasta que el admin edite).
4. **OpenAPI** pública — versión **1.2.0**; operación `resolveContactByExternalId`.

## Límites

- No hay índice único `(accountId, externalId)` en MVP; duplicados son datos inconsistentes — `findFirst` devuelve uno arbitrario.
- Sync de catálogo, oportunidades o campos del CRM remoto queda fuera (backlog F3-E1+).

## Referencias

- `docs/decisions/slice-l18-f3e1-crm-external-id-connector.md`
- `docs/decisions/slice-l14-f3e3-public-webhooks.md`
