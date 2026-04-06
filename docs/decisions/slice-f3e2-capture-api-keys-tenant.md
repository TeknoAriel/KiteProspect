# Slice F3-E2 — API keys por tenant para captura (`POST /api/contacts/create`)

**Fecha:** 2026-04-06  
**Referencias:** `docs/roadmap.md` F3-E2 (APIs documentadas + keys), L11 OpenAPI.

## Contexto

La captura pública dependía solo de `CAPTURE_API_SECRET` global, lo que complica multi-tenant por entorno (un solo secreto para todas las cuentas).

## Decisión

1. **Modelo:** `CaptureApiKey` (`keyPrefix` único global, `keyHash` bcrypt del secreto completo, `revokedAt` opcional).

2. **Formato:** `kp_<16 hex>_<32 hex>` generado en servidor; **no** se vuelve a mostrar tras el alta.

3. **Auth:** `POST /api/contacts/create` acepta **Bearer / X-Capture-Secret** igual al global **o** a una clave activa cuyo `accountId` coincida con el tenant resuelto por `accountSlug` / `accountId` del cuerpo.

4. **503:** sin `CAPTURE_API_SECRET` **y** sin claves activas para esa cuenta → captura no configurada.

5. **API admin:** `GET/POST /api/account/capture-api-keys`, `DELETE /api/account/capture-api-keys/[id]` (revocar). UI `/dashboard/account/capture-api-keys`.

6. **OpenAPI:** esquema `CaptureTenantBearer` + `503` actualizado.

## Consecuencias

- Producción puede seguir usando solo `CAPTURE_API_SECRET` o migrar a claves por tenant.
- Rotación: revocar y crear nueva clave.
