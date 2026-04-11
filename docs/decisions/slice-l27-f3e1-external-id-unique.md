# L27 — F3-E1+ Unicidad `externalId` por cuenta

## Contexto

Tras **L22** (resolve + webhook), un mismo ID de CRM no debería poder asociarse a dos contactos del mismo tenant; sin restricción en BD, condiciones de carrera y datos sucios complican integraciones.

## Decisión

1. **PostgreSQL:** índice único `("accountId", "externalId")` en `Contact`. Varios contactos con `externalId` null siguen permitidos (nulls distintos en unicidad PG).
2. **API:** `PATCH /api/contacts/{id}/external` responde **409** si otro contacto del tenant ya tiene ese `externalId`, con `conflictContactId` cuando se detecta antes del update; **409** genérico si Prisma devuelve `P2002` (carrera).
3. **OpenAPI** pública v1.2.1 — respuesta `409` y esquema `ExternalIdConflictBody`.

## Límites

- Bases con duplicados previos fallan al migrar: limpiar datos o fusionar contactos antes de `migrate deploy`.

## Referencias

- `docs/decisions/slice-l22-f3e1-crm-bridge-resolve-webhook.md`
- `docs/decisions/slice-l18-f3e1-crm-external-id-connector.md`
