# S22 — Ingesta de inventario KiteProp (XML OpenNavent + JSON Proppit)

## Contexto

Las inmobiliarias publican avisos en portales con formatos estándar (OpenNavent / Zonaprop) y suelen tener un JSON de actualización (Proppit u otro export). Queremos reflejar ese inventario en `Property` sin duplicar trabajo manual ni inventar datos.

## Decisión

1. **Modelo `Property`** (migraciones feed): `externalSource`, `externalId`, `importFingerprint`, `externalFeedUpdatedAt` (fecha del aviso en el feed), `amenities`, ubicación extendida, superficies, `rooms`, coordenadas, `feedLastSeenAt`, `feedRemovedAt`, estado `withdrawn` para bajas de feed.
2. **Clave única** por tenant: `(accountId, externalSource, externalId)` con `externalSource = "kiteprop"`.
3. **Configuración** en `Account.config.kitepropFeed`: `enabled`, `proppitJsonUrl`, `zonapropXmlUrl`, `delistMissing` (default true).
4. **Fusión de fuentes**: si hay JSON y XML, se construye un `Map` por `codigoAviso`; el XML **pisa** al JSON para el mismo id (más detalle y amenities).
5. **Idempotencia**: `importFingerprint` = SHA-256 de un payload estable (título, precio, amenities serializadas ordenadas, etc.). Si no cambia, solo se actualiza `feedLastSeenAt`.
6. **Delist**: con `delistMissing`, las filas `kiteprop` en `available` o `reserved` cuyo `externalId` no está en el snapshot pasan a `withdrawn` y `feedRemovedAt`. Snapshot vacío pero descarga válida implica baja de todas las activas importadas.
7. **Estados terminales manuales**: si `status` es `sold` o `rented`, el sync **no** lo fuerza a `available` (respeta cierre manual).
8. **Cron**: `GET /api/cron/kiteprop-property-feed` con la misma auth que otros crons (`CRON_SECRET` / `x-vercel-cron`). Schedule objetivo **cada 30 min** (`*/30 * * * *` UTC); incremental/manifiesto: `docs/decisions/slice-s32-kiteprop-incremental-json-cron.md`; límite **Hobby**: `docs/decisions/vercel-hobby-cron-daily-kiteprop-feed.md`. Sync manual sigue disponible.
9. **URLs**: en producción solo `https:`; `http` permitido en desarrollo para pruebas locales.

## Implementado

- Dominio: `parse-zonaprop-xml`, `parse-proppit-json`, `sync-kiteprop-feed`, tipos `kiteprop-feed-types`.
- Auth-tenancy: `account-kiteprop-feed-config.ts`.
- API: cron + `kiteprop-feed-config` + `kiteprop-feed-sync`.
- UI: `/dashboard/account/property-feeds` y enlaces desde el hub de cuenta.
- Validación ABM: `withdrawn` en `PROPERTY_STATUSES`.
- Serialización API/UI: campos de feed en `SerializedProperty`.
- Dependencia: `fast-xml-parser` en `@kite-prospect/web`.

## Pendiente / Fase 2

- Afinar parser JSON a un schema Proppit real si difiere del OpenNavent en objeto.
- Métricas/alertas si el feed falla N veces seguidas.
- Worker dedicado si el volumen supera límites de `maxDuration` en Vercel.

## Bloqueado por acción humana

- Pegar en la UI las URLs HTTPS reales del export por tenant.
- Ver `docs/manual-actions-required.md` si se documenta checklist de producción para feeds.
