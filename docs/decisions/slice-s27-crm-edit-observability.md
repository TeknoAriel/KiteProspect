# S27 — Edición tareas/notas + logs estructurados CRM

**Fecha:** 2026-04-02  
**Ref roadmap:** F1-E13 (CRM básico), backlog transversal observabilidad.

## Decisión

1. **CRM:** permitir **editar notas** y **editar / completar / cancelar tareas** desde la ficha del contacto, con validación por tenant y **auditoría** (`contact_note_updated`, `contact_task_updated`, `contact_task_completed`).
2. **Modelo:** `Note` incorpora **`updatedAt`** (`@updatedAt`) para trazabilidad de ediciones; migración `20260402120000_add_note_updated_at`.
3. **Observabilidad:** líneas JSON vía `logStructured` (sin PII) en:
   - creación/actualización de tareas y notas (`crm_task_*`, `crm_note_*`);
   - guardado de perfil declarado (`contact_search_profile_declared_saved`, alineado con auditoría);
   - inicio de recálculo de matches desde UI (`contact_matches_recalc_started`, antes de `property_matches_synced` en sync);
   - `PATCH` de etapas de contacto (`contact_stages_patched`).

## Implementado

- `contact-task-actions.ts`: `updateContactTaskAction`, `completeContactTaskAction`; logs en create/update/complete.
- `contact-note-actions.ts`: `updateContactNoteAction`; log en create/update.
- `contact-task-row.tsx`, `contact-note-row.tsx`; `page.tsx` actualizado.
- `contact-search-profile-actions.ts`, `matching-actions.ts`, `api/contacts/[id]/route.ts`: logs adicionales.
- Migración Prisma `Note.updatedAt`.

## Pendiente

- Listado de tareas completadas recientes en ficha (opcional).
- Métricas agregadas fuera de logs de línea (Fase 2 / proveedor APM).

## Bloqueado por acción humana

Ninguno. En deploy, `build:vercel` aplica migraciones automáticamente.
