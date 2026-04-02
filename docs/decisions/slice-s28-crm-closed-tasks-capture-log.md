# S28 — Tareas cerradas en ficha + log captura lead

**Fecha:** 2026-04-02  
**Ref roadmap:** F1-E13 (CRM), backlog transversal observabilidad.

## Decisión

1. **Ficha contacto:** mostrar hasta **15 tareas** en estado `completed` o `cancelled`, ordenadas por `updatedAt` descendente, **solo lectura** (trazabilidad operativa sin reabrir tareas en este slice).
2. **Captura:** tras un `createLeadCapture` exitoso, emitir **`logStructured("lead_captured", …)`** con `accountId`, `contactId`, `channel`, `newContact`, `hasInboundMessage`, `source` (`api` | `public_form`), sin PII.

## Implementado

- `apps/web/src/app/dashboard/contacts/[id]/page.tsx` — consulta `completedTasks` + bloque UI.
- `apps/web/src/domains/capture/services/create-lead-capture.ts` — flag `createdNewContact` + log.

## Pendiente

- Reabrir tarea cerrada o filtrar por rango de fechas (opcional).
- Correlación request-id si se expone tracing distribuido.

## Bloqueado por acción humana

Ninguno.
