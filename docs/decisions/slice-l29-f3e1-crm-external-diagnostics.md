# L29 — F3-E1+ Diagnóstico duplicados `externalId` (admin)

## Contexto

La migración **L27** añade unicidad `(accountId, externalId)`. Antes de desplegar, conviene detectar duplicados en datos legados sin abrir SQL a mano.

## Decisión

1. **Dominio:** `findDuplicateExternalIdsForAccount(accountId)` — agregación SQL por `externalId` con `HAVING COUNT(*) > 1`.
2. **API:** `GET /api/account/diagnostics/crm-external` — solo **admin** del tenant; JSON con `contactsWithExternalId`, `duplicateExternalIdGroups`, `hasDuplicates` (sin PII de contactos).
3. **UI:** `/dashboard/account/diagnostics/crm-external` — tabla de duplicados + enlace al hub de cuenta.

## Límites

- Con índice único aplicado, la consulta de duplicados debería devolver siempre vacío; sigue siendo útil en entornos previos al deploy o si se relaja la restricción en el futuro.

## Referencias

- `docs/decisions/slice-l27-f3e1-external-id-unique.md`
