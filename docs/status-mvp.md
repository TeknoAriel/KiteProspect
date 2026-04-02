# Estado del MVP (Fase 1) — snapshot

Documento vivo: refleja lo **implementado** en código frente al alcance de `PRODUCT_DEFINITION.md` (sin prometer features fuera).

## Implementado (técnico)

| Área | Qué hay |
|------|---------|
| **Multi-tenant** | Datos filtrados por `accountId` de sesión; login con **slug de cuenta** + email + contraseña. Seed demo opcional: `slice-demo-showcase-tour.md`. |
| **Configuración cuenta (F1-E2 MVP)** | Centro admin `/dashboard/account` (módulos, conexión Vercel, endpoints, IA, seguimientos) + ajustes generales + prompt IA + edición planes de seguimiento (`/dashboard/account/follow-up-plans`) + feeds inventario (`/dashboard/account/property-feeds`); S13, S17, S21, S22. |
| **Inventario propiedades (F1-E4)** | ABM `/dashboard/properties` + API; mutaciones admin/coordinator; lectura asesor; ingesta KiteProp XML/JSON + cron + sync manual (`slice-s22-kiteprop-property-feed.md`); `slice-s14-properties-abm.md`. |
| **Auth** | NextAuth (credenciales), JWT, `SessionProvider`, `/dashboard/*` protegido con `auth()` en middleware (Auth.js v5). |
| **Usuarios (F1-E3)** | ABM de usuario por tenant en `/dashboard/users` + API; hash bcrypt en alta/edición; no borrar usuario autenticado; `slice-s15-users-abm.md`. |
| **Asesores (F1-E3)** | ABM `/dashboard/advisors` + API; vínculo opcional usuario del tenant (un usuario → un asesor); `slice-s16-advisors-abm.md`. |
| **Cuentas** | Vista de lectura admin (`/dashboard/accounts`). |
| **CRM básico** | Lista y ficha; búsqueda/filtros/paginación; **notas y tareas con edición** (S27); **tareas cerradas recientes** en ficha (S28); reasignación y pausa de seguimiento (`slice-crm-contacts-filters-assignment-followup-pause.md`); **edición etapas** comercial/conversacional en ficha (S25). |
| **Inbox** | Lista con filtros (S18), búsqueda y paginación (S19), rango por fecha UTC `from`/`to` en `updatedAt` (S25); **no leído** si hay entrante posterior a `Conversation.lastReadAt` (S29) + hilo con IA y borrador WhatsApp (S12). |
| **Perfil declarado** | Página dedicada (`/dashboard/contacts/[id]/profile`): lectura del perfil más reciente (matching) + **edición del perfil declarado** (`SearchProfile` `source=declared`) y sincronización de `Contact.declaredProfile` para IA; S26. |
| **Scoring** | Reglas MVP + recálculo seguro con `accountId` (`/dashboard/contacts/[id]/score`); `fitScore` usa promedio de hasta 3 mejores matches; intent/readiness ampliados (S24). |
| **Seguimiento** | Lectura de planes y secuencias (`/dashboard/followups`). |
| **Seguimiento (jobs)** | Cron `GET /api/cron/follow-up-due` + `processDueFollowUps`: **WhatsApp** (Meta), **email** (Resend si `RESEND_API_KEY` + `FOLLOW_UP_FROM_EMAIL`; si no, tarea en ficha), **Instagram/otros** → tarea manual; ver `docs/decisions/slice-follow-up-channels-email-manual.md`. |
| **WhatsApp** | Entrada: webhook `/api/webhooks/whatsapp`; `slice-s08`. Saliente: `POST /api/whatsapp/send` (admin), Graph API; `slice-s09`. |
| **IA conversacional (base)** | `POST /api/ai/conversation/next-action` (admin/coordinator); proveedor dual S10; reglas handoff + versionado prompt S11 (`slice-s11-conversational-handoff-rules.md`). |
| **Dashboard (F1-E16)** | KPIs por tenant: nuevos contactos (7 días), conversaciones abiertas vs total, propiedades disponibles, tabla pipeline por `commercialStage` (`slice-s23-dashboard-kpis.md`); navegación. |
| **Auditoría** | `recordAuditEvent` + evento `session_started` en login + evento de seed; UI admin (`/dashboard/audit`). |
| **Captura (API)** | `POST /api/contacts/create` con `CAPTURE_API_SECRET` + `accountSlug` (o `accountId`), email o teléfono; validación de campos + rate limit por IP (memoria); evento `lead_captured`; log estructurado `lead_captured` tras éxito (S28). |
| **Captura (formulario)** | `/lead` opcional con `ENABLE_PUBLIC_LEAD_FORM=true`; misma lógica vía server action (auditoría `via: public_lead_form`). |
| **Captura (widget)** | `kite-lead-widget.js` → iframe `/embed/lead`; canal `web_widget`; ver `docs/capture-integration.md`. |
| **Captura (landings)** | Patrones unificados + ejemplos copy-paste: `docs/capture-integration.md` §4, `docs/examples/`. |
| **Matching v0** | Reglas sobre inventario `available` + `syncPropertyMatchesForContact`; UI recalcular en ficha; envío por WhatsApp con `Recommendation` (S20); tests Vitest (matching + dimensiones; lead-score-rules); log estructurado en sync; UX reenvío WA cuando `sentAt` (L1); `slice-s04-matching-v0.md`, `slice-s20-property-recommendation-whatsapp.md`. |

## Plan de trabajo actual

Sprint **L1** cerrado (2026-03-30): backlog L1 en `docs/execution-plan-sprints.md` completado; resumen `docs/decisions/slice-l1-batch-completion.md`. **S25** cerrado (inbox fechas/etapas/logs). Siguiente: priorizar deuda F1-E13 u otros ítems de Fase 1 según `docs/roadmap.md`.

**Entorno dev (Git):** push/fetch por SSH en Windows documentado en `docs/decisions/github-ssh-windows-dev.md` (registro de clave pública en GitHub: `docs/manual-actions-required.md` ítem 11).

**Sprint S26 (F1-E10):** perfil declarado editable en UI; ver `docs/decisions/slice-s26-declared-search-profile-ui.md`.

**Sprint S27 (F1-E13 + observabilidad):** edición de notas/tareas en ficha, logs estructurados CRM; ver `docs/decisions/slice-s27-crm-edit-observability.md`.

**Sprint S28 (F1-E13 + captura):** tareas completadas/canceladas recientes en ficha; log `lead_captured` en servicio de captura; ver `docs/decisions/slice-s28-crm-closed-tasks-capture-log.md`.

**Sprint S29 (F1-E8):** estado leído/no leído en inbox (`lastReadAt`); ver `docs/decisions/slice-s29-inbox-read-state.md`.

## Pendiente respecto a Fase 1 (producto)

Definido en `PRODUCT_DEFINITION.md` y **aún no** cerrado como slice completo:

- WhatsApp: webhook + envío **implementados**; desde inbox (S12) coordinador/admin puede enviar borrador IA; plantillas Meta / políticas 24 h si se priorizan.
- Motor conversacional: S10–S12; **envío totalmente automático** del borrador sin humano sigue fuera del MVP intencionalmente.
- Jobs (BullMQ) para seguimiento automático **no** implementados a propósito en MVP (evitar automatización prematura).

## Bloqueado por acción manual

Ver **`docs/manual-actions-required.md`**: PostgreSQL, `.env` (`DATABASE_URL`, `AUTH_SECRET`), migraciones/reset si el esquema cambió.

## TODO explícito Fase 2+

- Resolver tenant por subdomain además de slug en login.
- OAuth, reset de contraseña, permisos granulares.
- CRUD UI adicional para otras entidades (tareas, notas, etc.; sin convertir en CRM enterprise).
