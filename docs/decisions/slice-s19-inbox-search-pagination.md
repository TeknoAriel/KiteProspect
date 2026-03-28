# Slice S19 — Inbox búsqueda de texto + paginación (F1-E8)

## Contexto

`slice-s18-inbox-filters.md` dejaba como pendiente MVP la búsqueda por texto y la paginación. La lista puede crecer y los operadores necesitan encontrar conversaciones por contacto o por contenido del hilo.

## Decisión

- Se mantiene `/dashboard/inbox` como server component; parámetros vía query string.
- **Búsqueda `q`:** hasta 200 caracteres (trim + slice). Si hay texto, el `where` combina `accountId` + filtros S18 con un `OR`:
  - contacto: `name`, `email` o `phone` con `contains` + `mode: "insensitive"`;
  - o algún mensaje con `content` `contains` insensitive (`messages.some`).
- **Paginación:** `page` (entero ≥ 1, default 1), `pageSize` permitido **10 | 20 | 50** (default 20). Tras `count` con el mismo `where`, se acota `page` a `totalPages` y luego `findMany` con `skip`/`take`.
- **Enlaces** Anterior/Siguiente y el formulario GET preservan `q`, `channel`, `status` y `pageSize` cuando aplica (URLs limpias: sin `status` cuando es el default implícito `active` sin param inicial, alineado a S18).

## Pendiente (Fase 2+)

- Filtro por rango de fechas.
- Orden configurable.
- Full-text / índices si el volumen lo exige.
- Marcar como leído (ver `mvp-phase1-status.md`).

## Referencias

- `apps/web/src/app/dashboard/inbox/page.tsx`
