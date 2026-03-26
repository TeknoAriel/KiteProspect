# Slice S14 — ABM de propiedades (F1-E4)

## Contexto

`PRODUCT_DEFINITION.md` y `docs/roadmap.md` (F1-E4) exigen inventario real para matching y principio **no inventar propiedades**. El modelo `Property` ya existía en Prisma y seed; faltaba UI y API de gestión por tenant.

## Decisión

- **Rutas dashboard:** `/dashboard/properties` (lista), `/dashboard/properties/new`, `/dashboard/properties/[id]/edit`.
- **API REST:** `GET/POST /api/properties`, `GET/PATCH/DELETE /api/properties/[id]`; siempre con `accountId` de sesión.
- **Roles:** lectura para cualquier usuario autenticado del tenant; **alta/edición/baja** solo `admin` o `coordinator` (misma línea que envío WhatsApp e inbox operativo).
- **Validación:** tipos `departamento|casa|terreno`, intent `venta|renta`, estado `available|reserved|sold|rented`; precio ≥ 0; `Decimal` serializado como string en JSON.
- **Auditoría:** `property_created`, `property_updated`, `property_deleted` con `entityType: property`.
- **Baja:** `DELETE` en cascada sobre `PropertyMatch` (FK); UI advierte antes de confirmar.

## Pendiente (Fase 2+)

- Importación masiva / CSV.
- Fotos y campos comerciales extendidos sin inflar el MVP.

## Referencias

- Schema: `packages/db/prisma/schema.prisma` (`Property`).
- Matching: `docs/decisions/slice-s04-matching-v0.md`.
