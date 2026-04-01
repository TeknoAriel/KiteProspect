# CRM: filtros en lista de contactos, reasignación y pausa de seguimiento

## Contexto

F1-E13 pedía pipeline y operación básica; la lista de contactos seguía limitada a 50 sin búsqueda. Coordinación requiere **reasignar asesor** y **pausar seguimiento** sin esperar Fase 2.

## Decisión

1. **`/dashboard/contacts`**: query params `q` (nombre/email/teléfono), `commercial` (etapa comercial o `all`), `conv` (etapa conversacional o `all`), `page`, `pageSize` (10/20/50). Valores de etapa alineados a `docs/product-rules.md`.
2. **`PATCH /api/contacts/[id]/assignment`**: cuerpo `{ advisorId }`; cierra asignaciones `active` como `transferred` y crea una nueva `active` con `assignedBy` y auditoría `contact_assigned`. Roles: admin, coordinador.
3. **`PATCH /api/follow-up-sequences/[id]`**: cuerpo `{ status: "paused" | "active" }`; comprueba que la secuencia pertenezca al tenant vía `contact.accountId`. El cron ya filtra `status: "active"` en `processDueFollowUps`. Auditoría `follow_up_sequence_paused` / `follow_up_sequence_resumed`.
4. **Ficha contacto**: formulario de asignación y controles de pausa/reanudación por secuencia (hasta 5 recientes).

## Implementado

- Rutas API y UI descritas; texto de ayuda en seguimientos globales.

## Pendiente

- Listado global de secuencias en pausa (opcional).
- Desasignar sin nuevo asesor (no implementado: requiere regla de negocio explícita).
