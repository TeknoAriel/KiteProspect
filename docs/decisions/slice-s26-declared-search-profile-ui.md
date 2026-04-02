# S26 — Perfil declarado editable (F1-E10)

**Fecha:** 2026-04-01  
**Ref roadmap:** F1-E10 (perfil declarado).

## Decisión

Exponer en **`/dashboard/contacts/[id]/profile`** la edición del **`SearchProfile` con `source: "declared"`** (formulario con campos alineados al matching v0: intención, tipo, zona, precios, dormitorios/baños, JSON opcional). Cualquier usuario autenticado del tenant puede guardar (mismo criterio práctico que notas/tareas en ficha).

Al persistir:

1. **`upsertDeclaredSearchProfile`** (servicio) crea o actualiza el registro declarado.
2. Se mantiene **`updateConversationalStage`** según datos útiles (`profiled_partial` / `profiled_useful`).
3. Se sincroniza **`Contact.declaredProfile`** (JSON) para el contexto de IA en `plan-next-conversation-action.ts`.
4. **Auditoría:** `contact_search_profile_declared_saved` con metadatos mínimos (sin PII).

El bloque superior de la página muestra el **perfil más reciente por `updatedAt`** (declarado o inferido), que es el que usa el matching; el formulario edita siempre la variante **declarada**.

## Implementado

- `apps/web/src/domains/crm-leads/services/update-profile.ts` — `upsertDeclaredSearchProfile`, `syncContactDeclaredProfileJson`.
- `apps/web/src/app/dashboard/contacts/[id]/contact-search-profile-actions.ts` — server action + validación.
- `apps/web/src/app/dashboard/contacts/[id]/declared-profile-form.tsx` — formulario cliente.
- `apps/web/src/app/dashboard/contacts/[id]/profile/page.tsx` — lectura último perfil + formulario.

## Pendiente

- API REST pública del mismo contrato (opcional; el MVP usa server action).
- Edición masiva o inferencia automática (Fase 2).

## Bloqueado por acción humana

Ninguno.
