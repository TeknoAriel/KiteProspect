# Contrato de integración: `lead.qualified` → KiteProp (handoff)

Versión alineada al adaptador `sendLeadQualifiedToKiteprop` y al procesador `processIntegrationOutboundJob`.

## Implementado

### Transporte

| Aspecto | Valor |
|--------|--------|
| Método | `POST` |
| URL | Por entorno: `Account.config.kitepropHandoffUrl` → si vacío, `KITEPROP_HANDOFF_URL` → si vacío, `KITEPROP_HANDOFF_MOCK_URL` → en dev/preview, fallback local mock (ver `resolveKitepropHandoffUrl`). **No** fijar hostnames de producción de KiteProp en código; acordar staging/demo por escrito. |
| Cuerpo | JSON: evento `lead.qualified`, `schema_version`, `dedupe_key`, `tenant`, `contact`, `lead`, `qualification`; `event_id` y `occurred_at` determinísticos a partir de `dedupe_key`. |
| Firma | Cabecera `X-Kite-Signature`: HMAC del body UTF-8 con secreto `KITEPROP_HANDOFF_HMAC_SECRET` o `KITEPROP_HANDOFF_HMAC_SECRET_<SLUG_CUENTA>`. |

### `dedupe_key`

- Formato estable: `buildDedupeKey(accountId, leadId)` (ver `handoff-webhook.ts`).
- Uso: el receptor puede deduplicar entregas repetidas; `event_id` deriva de la misma clave (determinístico).

### `external_id` (contacto CRM)

- Campo `contact.external_id` en el payload JSON (nullable). Es el conector hacia el CRM; si falta, va `null` / omitido según serialización.

### Clasificación de respuestas (lado Prospect)

| HTTP | Tratamiento | Transición local a `handed_off` |
|------|-------------|----------------------------------|
| **2xx** | ACK | Sí (tras `updateMany` exitoso) |
| **409** | ACK (duplicado / idempotencia en receptor) | Sí |
| **422** | Fatal: **sin** reintento BullMQ (`UnrecoverableError`) | No |
| **429**, **5xx**, **0** (red/timeout) | Reintento | No en ese intento |
| Otros **4xx** | Fatal (sin reintento) | No |

- El campo persistido `HandoffOutboundAttempt.ok` significa **ACK** (2xx o 409), no “HTTP ok” genérico.

### Cuerpo de respuesta en **200**

- Prospect no exige un esquema JSON fijo del receptor para considerar ACK: basta el status 2xx. El cuerpo puede almacenarse truncado en `responseSnippet` para operación.

### Errores típicos

| Status | Significado operativo |
|--------|------------------------|
| 200–299 | Entrega aceptada. |
| 409 | Duplicado reconocido por dedupe; equivalente a ACK para Prospect. |
| 422 | Payload inválido ante el receptor; corregir datos y **replay** manual (`handoff-retry`) tras arreglo. |
| 500+ | Fallo temporal; reintentos con backoff (BullMQ). |

## Pendiente / acuerdo con KiteProp

- Esquema JSON de respuesta 200 si se desea correlación de IDs en CRM (opcional, no bloquea ACK).

## Bloqueado por acción manual

- URL y secreto HMAC por entorno acordados con el equipo KiteProp; variables en `.env` / Vercel (ver `docs/kiteprop-integration-runbook.md`).
