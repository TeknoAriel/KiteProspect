# L22b — F3-E1+ Sincronización inbound por lotes (sin proveedor CRM concreto)

## Contexto

`PRODUCT_DEFINITION` Fase 3 y `docs/roadmap.md` F3-E1 contemplan **CRM externo** con sync según negocio. L18–L29 cubrieron vínculo `externalId`, resolve, unicidad, lectura y diagnóstico de duplicados. Falta un paso **profundo** que no dependa de un producto CRM licenciado en el código.

## Decisión

1. **`POST /api/contacts/crm-batch-sync`** — el **CRM o middleware** (n8n, worker propio) **empuja** actualizaciones a Kite: hasta **100** ítems por request, cada uno con `contactId` y campos opcionales (`externalId`, `commercialStage`, `conversationalStage`, `branchId` o `branchSlug`).
2. **Autenticación:** igual que `POST /api/contacts/create` (captura global o `kp_…`) con resolución `accountSlug`/`accountId`; con secreto global, `accountId` en el cuerpo debe coincidir con el tenant resuelto. **Sesión** dashboard admin/coordinador también permitida (pruebas y scripts internos).
3. **Semántica:** resultados **por ítem** (`ok` | `error`); conflictos de `externalId` no abortan el lote. Auditoría y webhooks alineados a `PATCH …/external` y `PATCH /api/contacts/[id]` (`contact.external_id_updated`, `contact.stages_updated`; sucursal solo auditoría).
4. **Límites:** Kite **no** invoca HTTP al CRM; no hay cola BullMQ ni OAuth. OpenAPI **1.2.3**, operación `postCrmBatchSync`.

## Referencias

- `apps/web/src/domains/crm-leads/crm-batch-sync.ts`
- `docs/decisions/slice-l22-f3e1-crm-bridge-resolve-webhook.md`
