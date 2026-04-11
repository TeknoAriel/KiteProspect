# L28 — F3-E1+ GET vínculo CRM (`/api/contacts/{id}/external`)

## Contexto

Tras **L22** (resolve por `externalId`) y **L27** (unicidad), las integraciones server-side a veces necesitan **confirmar** el estado del vínculo partiendo del **ID interno** del contacto en Kite (p. ej. tras `POST /api/contacts/create`).

## Decisión

1. **`GET /api/contacts/{id}/external`** — mismo recurso que el `PATCH`; devuelve `id`, `externalId`, `commercialStage`, `conversationalStage`, `branchId`.
2. **Auth:** sesión **admin/coordinador** (contacto del tenant) **o** captura (`Bearer` / `X-Capture-Secret` global o `kp_…`). Con secreto global, **`accountId` en query string** (equivalente al cuerpo del PATCH).
3. **Rate limit** por IP: misma clave que `PATCH` (`contact-external-api`).
4. **Log** estructurado `contact_external_read` (`accountId`, `contactId`, `via`: `session` | `capture_auth`) sin PII extra.

## Límites

- No expone notas, tareas ni mensajes; solo datos ya alineados a `GET …/resolve-external`.

## Referencias

- `docs/decisions/slice-l22-f3e1-crm-bridge-resolve-webhook.md`
- `docs/decisions/slice-l18-f3e1-crm-external-id-connector.md`
