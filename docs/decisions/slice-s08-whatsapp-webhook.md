# Decisión: WhatsApp webhook base (F1-E15 / Sprint S08)

## Implementado

1. **Ruta** `GET|POST /api/webhooks/whatsapp`
   - **GET:** verificación Meta (`hub.mode`, `hub.verify_token`, `hub.challenge`) con `WHATSAPP_VERIFY_TOKEN`.
   - **POST:** cuerpo JSON del Cloud API; firma opcional `X-Hub-Signature-256` con `WHATSAPP_APP_SECRET` (recomendado en producción).
2. **Tenant MVP:** una cuenta por despliegue vía **`WHATSAPP_ACCOUNT_SLUG`** (ej. `demo`). Varias cuentas / WABA por fila en BD queda para Fase 2.
3. **Persistencia:** `Contact` (por teléfono normalizado), `Conversation` `channel=whatsapp`, `Message` inbound con `metadata.waMessageId`.
4. **Deduplicación:** `waMessageId` único por mensaje (consulta SQL en `metadata`).
5. **Opt-out:** palabras clave (STOP, BAJA, etc.) → `Consent` `whatsapp` con `granted: false` y `revokedAt`.
6. **Estados:** webhook de **statuses** (`sent`, `delivered`, `read`, `failed`) actualiza `Message.status` y metadatos.
7. **Auditoría:** `whatsapp_inbound_received` por mensaje entrante.

## No incluido (S09)

- Envío de respuestas (`POST` a Graph API), plantillas, cumplimiento avanzado.

## Variables de entorno

Ver `.env.example` y `docs/manual-actions-required.md`.

## Referencias

- `apps/web/src/app/api/webhooks/whatsapp/route.ts`
- `apps/web/src/domains/integrations/whatsapp/`
