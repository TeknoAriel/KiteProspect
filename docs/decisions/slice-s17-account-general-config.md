# Slice S17 — Account settings generales (F1-E2)

## Contexto

`docs/roadmap.md` define F1-E2 como CRUD mínimo de `Account` y settings en `Account.config`. Ya existía hub `/dashboard/account` y override IA, pero faltaban ajustes generales de cuenta.

## Decisión

- **API admin:** `GET/PATCH /api/account/general-config`.
- **Campos MVP:** `Account.name` y `Account.config.timezone`.
- **Seguridad:** solo rol `admin`.
- **UI:** nueva pantalla `/dashboard/account/general` accesible desde el hub.
- **Auditoría:** evento `account_general_config_updated`.
- **Scope:** no se edita `slug` (se mantiene estable para login).

## Pendiente (Fase 2+)

- Más claves comerciales en `Account.config` con validación (horarios, firma, etc.).
- Versionado/rollback de cambios de configuración.

## Referencias

- `apps/web/src/app/api/account/general-config/route.ts`
- `apps/web/src/app/dashboard/account/general/page.tsx`
