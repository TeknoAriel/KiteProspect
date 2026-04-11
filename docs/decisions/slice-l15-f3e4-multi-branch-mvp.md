# L15 / F3-E4 — Multi-sucursal (MVP)

**Fecha:** 2026-04-06  
**Estado:** implementado (MVP).

## Contexto

`docs/roadmap.md` F3-E4: multi-sucursal profundo. Sin convertir el producto en ERP: **primer paso** con entidad `Branch`, contactos etiquetados y filtros CRM. **No** incluye permisos por sucursal por rol ni reporting por sucursal en dashboard (backlog).

## Decisión

1. **Modelo `Branch`:** `accountId`, `name`, `slug` (único por cuenta), `status` `active` | `archived`.
2. **`Contact.branchId`** opcional, `onDelete: SetNull` si se borra sucursal (no implementado borrado duro; se usa **archivar**).
3. **Admin:** `GET/POST /api/account/branches`, `PATCH /api/account/branches/[id]` (nombre, archivar). UI `/dashboard/account/branches`.
4. **CRM:** `PATCH /api/contacts/[id]` acepta `branchId` (`null` limpia). Coordinador/admin.
5. **Lista contactos:** filtro `?branch=<id>` si hay sucursales activas.
6. **Captura:** `branchSlug` opcional en `createLeadCapture` y `POST /api/contacts/create`; resolución por `accountId` + slug activo; slug inexistente **no** falla la captura.
7. **Slug:** `slugifyBranchName` + unicidad con sufijo `-2`, `-3` si hace falta.

## Pendiente (F3-E4+)

- Usuario/asesor restringido a sucursal; **reporting por sucursal** en `/dashboard/reportes` — **hecho** en L19 (`slice-l19-f3e4-operational-reports-by-branch.md`); permisos por rol siguen pendientes.
- Propiedades por sucursal si el negocio lo exige.

## Referencias

- `docs/product-rules.md` (si se añade sección sucursales).
- `docs/status-mvp.md`
