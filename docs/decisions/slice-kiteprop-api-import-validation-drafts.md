# Slice: import KiteProp REST + borradores revisión humana

## Contexto

Validar el producto con datos reales del CRM sin envío automático a canales finales.

## Decisión

- Tablas `KitepropLeadSyncRun`, `KitepropLeadSyncCursor`, `LeadReplyDraftReview`.
- Ingesta con `IngestionIdempotencyKey.source = kiteprop_rest`.
- `Lead.source = kiteprop_api` para trazabilidad.
- `KITEPROP_IMPORT_REVIEW_MODE=true` corta envío en `sendWhatsAppTextToContact` y `sendFollowUpEmailToContact`.

## Documentación

`docs/kiteprop-import-validation-mode.md`

## Pendiente

- Alinear path y query params con documentación OpenAPI definitiva del tenant KiteProp.
- Botón de envío desde borrador aprobado (fuera de esta fase).
