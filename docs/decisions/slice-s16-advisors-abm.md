# Slice S16 — ABM de asesores por tenant (F1-E3)

## Contexto

`docs/roadmap.md` (F1-E3) incluye `Advisor` con asociación opcional a `User`. Existía solo lista de lectura en `/dashboard/advisors`.

## Decisión

- **API:** `GET/POST /api/advisors`, `GET/PATCH/DELETE /api/advisors/[id]`, scope por `accountId`; solo `admin` y `coordinator`.
- **Datos:** nombre obligatorio; email/teléfono opcionales; estado `active` | `inactive` (MVP).
- **Vínculo usuario:** `userId` opcional; debe ser un `User` del mismo tenant; **como máximo un asesor por usuario** en la cuenta (validación en API, 409 si conflicto).
- **Baja:** `DELETE` elimina el `Advisor`; por schema, `Assignment` asociadas hacen **cascade** (advertencia en UI).
- **Auditoría:** `advisor_created`, `advisor_updated`, `advisor_deleted`.

## Pendiente (Fase 2+)

- Reasignar contactos antes de borrar en flujo guiado.
- Reglas de negocio más estrictas (ej. solo `User` con rol `advisor`).

## Referencias

- `packages/db/prisma/schema.prisma` (`Advisor`, `Assignment`).
