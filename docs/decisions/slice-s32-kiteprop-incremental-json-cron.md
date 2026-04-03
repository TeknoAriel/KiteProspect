# S32 — Feed KiteProp JSON: incremental, manifiesto, cron 30 min, baja delete/withdraw

## Contexto

Se requiere consumir un JSON (y opcionalmente XML) con **id de aviso** y **fecha de última actualización**, controlar cambios entre lecturas, evitar trabajo innecesario cuando nada cambió, y retirar del inventario lo que ya no viene en el feed (incl. borrado en BD si aplica).

## Reglas de negocio

1. **Persistencia por aviso:** `Property.externalId` + `Property.externalFeedUpdatedAt` (fecha del feed cuando el JSON/XML la trae).
2. **HTTP condicional:** `If-None-Match` / `If-Modified-Since` con valores guardados en `Account.config.kitepropFeed` (`lastProppitEtag`, `lastProppitLastModified`, análogos XML). Si el origen responde **304**, no se procesa cuerpo (omisión de “descarga” útil).
3. **Manifiesto estable:** `SHA-256` de líneas ordenadas `externalId\tfeedUpdatedAt` (`computeFeedManifestSha256`). Si coincide con `lastMergedManifestSha256` y está activada la opción `skipManifestIfUnchanged`, se omiten upserts y bajas en esa corrida (el fetch ya ocurrió; si el servidor no soporta 304, igual se evita escritura masiva).
4. **Contenido por fila:** sigue existiendo `importFingerprint` (SHA-256 del payload de negocio incl. `feedUpdatedAt`) para omitir `UPDATE` si la fila no cambió.
5. **Avisos ausentes en el snapshot:** con `delistMissing`, según `removalPolicy`:
   - `withdraw`: `status = withdrawn`, `feedRemovedAt`.
   - `delete`: `DELETE` en cascade de `PropertyMatch` y `Recommendation`.
6. **Fetch:** `cache: "no-store"` para no usar caché HTTP del runtime.

## Cron producción

- `apps/web/vercel.json`: `*/30 * * * *` (cada 30 minutos UTC).
- Plan **Vercel Hobby** puede imponer **como máximo un cron al día**; si el deploy falla, usar schedule diario o pasar a **Pro** — ver `docs/decisions/vercel-hobby-cron-daily-kiteprop-feed.md`.

## Implementado

- Migración `Property.externalFeedUpdatedAt`.
- Parsers JSON/XML: extracción de fechas típicas (`fechaModificacion`, `updatedAt`, etc.; XML `fechaModificacion` / `fechaPublicacion`).
- `sync-kiteprop-feed.ts`: outcome `{ stats, syncStatePatch }`; persistencia vía `applyKitepropFeedSyncStatePatch`.
- UI: política withdraw/delete, checkbox manifiesto, textos de cron.
- Tests Vitest: `sync-kiteprop-feed.test.ts` (manifiesto estable).

## Pendiente

- Si el proveedor no envía fechas, el manifiesto depende solo de ids; cambios de precio sin fecha siguen forzando fingerprint por fila.
