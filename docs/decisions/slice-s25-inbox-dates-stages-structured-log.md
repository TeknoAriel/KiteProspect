# S25 — Inbox por fechas (UTC), etapas editables en ficha, logs estructurados

## Contexto

Backlog en `docs/mvp-phase1-status.md` (inbox: filtro por rango de fechas) y roadmap transversal (observabilidad). F1-E13 beneficia de **ediciones de etapa** explícitas sin CRM enterprise.

## Decisión

1. **Inbox** (`/dashboard/inbox`): query params `from` y `to` en formato `YYYY-MM-DD`, aplicados a `Conversation.updatedAt` en **UTC** (inicio del día `from`, fin del día `to`). Se documenta en la UI.
2. **Contacto** — `PATCH /api/contacts/[id]` con `commercialStage` y/o `conversationalStage` validados contra `contact-stage-constants.ts` (alineado a `docs/product-rules.md`). Roles admin/coordinator. Auditoría `contact_stages_updated` con before/after.
3. **UI** — `ContactStagesForm` en ficha; valores legacy no listados se muestran en texto pero el desplegable usa valor por defecto canónico hasta guardar.
4. **Logs** — `lib/structured-log.ts` (`logStructured`); uso en: sync de matches (`property_matches_synced`), fin de batch `processDueFollowUps` (`follow_up_due_batch_done`), captura API OK (`lead_capture_api_ok`). Sin PII en payload.

## Implementado

- Archivos anteriores; `docs/execution-plan-sprints.md` y `docs/status-mvp.md` actualizados.

## Pendiente

- Marcar conversación como leída / no leído (Slice 4 Fase 2).
- Filtro por fecha con zona horaria de cuenta (requiere convención explícita).
