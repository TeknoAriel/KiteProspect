# S29 — Inbox: leído / no leído por conversación

**Fecha:** 2026-04-02  
**Ref roadmap:** F1-E8 (inbox unificado).

## Decisión

1. **`Conversation.lastReadAt`:** timestamp de la última vez que el equipo abrió el hilo en `/dashboard/inbox/[id]`. Nullable: sin abrir nunca, o conversación antigua antes de la migración.
2. **No leído:** existe al menos un `Message` `direction: inbound` con `createdAt` **posterior** a `lastReadAt` (si `lastReadAt` es null, cualquier entrante cuenta como pendiente de lectura respecto al listado).
3. **Marcado al abrir:** componente cliente `ConversationReadMarker` + server action `markConversationReadAction` en `useEffect` (evita marcar por **prefetch** de `<Link>`). `UPDATE` vía **`$executeRaw`** para **no** actualizar `Conversation.updatedAt` (el orden de la lista no debe saltar solo por abrir un hilo).
4. **Lista:** badge “No leído” + borde izquierdo; `groupBy` para último entrante por conversación en la página actual.
5. **Log:** `inbox_conversation_marked_read` (`accountId`, `conversationId`). Tras marcar, `revalidatePath("/dashboard/inbox")`.

## Implementado

- Migración `20260402140000_conversation_last_read_at`.
- `domains/conversations/mark-conversation-read.ts`, `conversation-read-marker.tsx`, `mark-conversation-read-action.ts`.
- `inbox/page.tsx`, ajuste `Link prefetch={false}` hacia el hilo.

## Pendiente

- Filtro “solo no leídas” en la lista (requiere consulta o subconsulta dedicada).
- Lectura por usuario (hoy es por tenant/equipo, no por `User`).

## Bloqueado por acción humana

Ninguno. Migración aplica en deploy (`build:vercel`).
