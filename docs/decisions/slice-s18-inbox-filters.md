# Slice S18 — Inbox filtros canal/estado (F1-E8)

## Contexto

`docs/roadmap.md` (F1-E8) exige lista de conversaciones con filtros por canal y estado. La lista existía, pero solo mostraba activas sin filtro.

## Decisión

- Se mantiene `/dashboard/inbox` como server component con filtros vía query params.
- Filtros implementados:
  - `channel`: `all|whatsapp|form|web_widget|landing`
  - `status`: `all|active|closed|archived`
- Los filtros se aplican en `prisma.conversation.findMany` con `accountId` de sesión.
- Se visualiza `conv.status` en cada tarjeta para trazabilidad operativa.

## Pendiente (Fase 2+)

- Búsqueda por texto.
- Paginación y orden configurable.

## Referencias

- `apps/web/src/app/dashboard/inbox/page.tsx`
