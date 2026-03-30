# Post-L1 — Alta de tarea desde ficha de contacto

**Fecha:** 2026-03-30  
**Ref:** F1-E13 (CRM básico), sin ampliar a CRM enterprise.

## Alcance

- Server action `addContactTaskAction`: crea `Task` con `status: pending`, tipos permitidos `call` | `visit` | `followup` | `other`, título obligatorio, descripción y `dueAt` opcionales.
- Scoped por tenant vía `contact.accountId` en sesión.
- Auditoría `contact_task_created` con metadata `{ type, hasDue }`.
- UI `ContactTasksForm` en `/dashboard/contacts/[id]`; la sección de tareas es siempre visible (lista hasta 20 pendientes).

## Pendiente (no en este slice)

- Completar / cancelar tarea desde UI, asignación a asesor en tarea, recordatorios.
