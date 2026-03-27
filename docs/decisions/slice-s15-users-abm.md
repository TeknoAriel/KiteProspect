# Slice S15 — ABM de usuarios por tenant (F1-E3)

## Contexto

`docs/roadmap.md` define F1-E3 como alta/edición/baja lógica de `User` y relación opcional con `Advisor`. Ya había vistas de lectura (`/dashboard/users`) pero faltaba operación.

## Decisión

- **API:** `GET/POST /api/users` y `GET/PATCH/DELETE /api/users/[id]`, siempre scoped por `accountId` de sesión.
- **Permisos:** solo `admin` y `coordinator` pueden leer/mutar usuarios.
- **Seguridad:** nunca se expone `password`; al crear/actualizar se guarda hash bcrypt.
- **UI:** `/dashboard/users` con CTA “Nuevo usuario”, edición por `/dashboard/users/[id]/edit`, formulario de alta/edición y baja con confirmación.
- **Regla de protección:** no permitir eliminar el usuario autenticado.
- **Auditoría:** eventos `user_created`, `user_updated`, `user_deleted`.

## Pendiente (Fase 2+)

- Gestión de permisos más granular.
- Reasignación guiada al eliminar usuarios con relaciones activas.

## Referencias

- Roadmap: `docs/roadmap.md` (F1-E3).
- Esquema: `packages/db/prisma/schema.prisma` (`User`, `Advisor`).
