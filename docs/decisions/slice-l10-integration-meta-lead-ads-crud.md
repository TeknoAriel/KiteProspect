# Slice L10 — CRUD admin Meta Lead Ads (`pageId`)

**Fecha:** 2026-04-04  
**Referencias:** F2-E6 (Meta Lead Ads), F1-E2 (configuración cuenta), L9 (lectura + firma).

## Contexto

Tras L9, la UI de integraciones era solo lectura. El alta de `Integration` `meta_lead_ads` con `config.pageId` dependía de seed o SQL manual (`docs/manual-actions-required.md` §6b).

## Decisión

1. **API** (solo admin del tenant):
   - `POST /api/account/integrations/meta-lead-ads` con `{ "pageId": "<digits>" }` crea `Integration` `type=meta_lead_ads`, `provider=meta`, `status=active`, `config={ pageId }`.
   - `PATCH /api/account/integrations/[id]` con `{ pageId?, status? }` para filas del mismo `accountId` y `type=meta_lead_ads`; `status` ∈ `active` | `paused`.

2. **Validación de pageId:** `normalizeMetaLeadPageId` — 6–32 dígitos (trim). Sin letras ni espacios internos.

3. **Unicidad global entre activas:** no pueden existir dos integraciones `meta_lead_ads` **activas** con el mismo `pageId` en distintas cuentas (o dos en la misma cuenta). Respuesta 409 con mensaje claro. Las filas `paused` no participan en el webhook (`/api/webhooks/meta-leads` ya filtra `status: active`) y no bloquean el mismo pageId para otra fila activa.

4. **Auditoría:** `integration_meta_lead_ads_created`, `integration_meta_lead_ads_updated`.

5. **UI:** `/dashboard/account/integrations` — formularios para editar cada fila Meta y “Añadir otra página”.

## Consecuencias

- Producción: el admin puede configurar pageId sin tocar la base a mano; secretos Meta siguen en Vercel.
