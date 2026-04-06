# Estado del MVP (Fase 1) — snapshot

Documento vivo: refleja lo **implementado** en código frente al alcance de `PRODUCT_DEFINITION.md` (sin prometer features fuera).

## Implementado (técnico)

| Área | Qué hay |
|------|---------|
| **Multi-tenant** | Datos filtrados por `accountId` de sesión; login con **slug de cuenta** + email + contraseña. Seed demo opcional: `slice-demo-showcase-tour.md`. |
| **Configuración cuenta (F1-E2 MVP)** | Centro admin `/dashboard/account` (módulos, conexión Vercel, endpoints, IA, seguimientos) + ajustes generales + **pesos matching** (`/dashboard/account/matching`, F2-E2 L5) + prompt IA + edición planes de seguimiento (`/dashboard/account/follow-up-plans`) + feeds inventario (`/dashboard/account/property-feeds`) + **integraciones Meta Lead Ads** (`/dashboard/account/integrations`, alta/edición `pageId`, L10); S13, S17, S21, S22. |
| **Inventario propiedades (F1-E4)** | ABM `/dashboard/properties` + **filtros** GET (búsqueda, estado, origen manual vs feed KiteProp) + API; mutaciones admin/coordinator; lectura asesor; ingesta KiteProp (`slice-s22`, `slice-s32`); `slice-s14-properties-abm.md`, `slice-s33-dashboard-ops-visibility.md`. |
| **Auth** | NextAuth (credenciales), JWT, `SessionProvider`, `/dashboard/*` protegido con `auth()` en middleware (Auth.js v5). |
| **Usuarios (F1-E3)** | ABM de usuario por tenant en `/dashboard/users` + API; hash bcrypt en alta/edición; no borrar usuario autenticado; `slice-s15-users-abm.md`. |
| **Asesores (F1-E3)** | ABM `/dashboard/advisors` + API; vínculo opcional usuario del tenant (un usuario → un asesor); `slice-s16-advisors-abm.md`. |
| **Cuentas** | Vista de lectura admin (`/dashboard/accounts`). |
| **CRM básico** | Lista y ficha; búsqueda/filtros/paginación; **notas y tareas con edición** (S27); **tareas cerradas recientes** en ficha (S28); reasignación y pausa de seguimiento (`slice-crm-contacts-filters-assignment-followup-pause.md`); **edición etapas** comercial/conversacional en ficha (S25). |
| **Inbox** | Lista con filtros (S18), búsqueda y paginación (S19), rango por fecha UTC `from`/`to` en `updatedAt` (S25); **no leído** si hay entrante posterior a `Conversation.lastReadAt` (S29) + hilo con IA y borrador WhatsApp (S12). |
| **Perfil declarado** | Página dedicada (`/dashboard/contacts/[id]/profile`): perfil **preferido** para matching (declarado > inferido) + **edición declarada** (`SearchProfile` `source=declared`) y sincronización de `Contact.declaredProfile` para IA; **exclusiones** `extra.excludedPropertyIds` (L5); **inferencia heurística** opcional (`source=inferred`, L4); S26 + L4. |
| **Scoring** | Reglas MVP + recálculo seguro con `accountId` (`/dashboard/contacts/[id]/score`); `fitScore` usa promedio de hasta 3 mejores matches; intent/readiness ampliados (S24). |
| **Seguimiento** | Lectura de planes y secuencias (`/dashboard/followups`); **inicio de secuencia desde ficha** (admin/coordinator) + historial de intentos con matriz oficial (`slice-s30`); **inferencia de rama** en cron v1 (`slice-l7`); **salto de pasos** si el perfil cubre la etapa (`slice-l8-matrix-step-skip.md`); **rama fijada manualmente** (`matrixBranchLocked`, L12). |
| **Seguimiento (jobs)** | Cron `GET /api/cron/follow-up-due` + `processDueFollowUps`: **WhatsApp** (Meta), **email** (Resend si `RESEND_API_KEY` + `FOLLOW_UP_FROM_EMAIL`; si no, tarea en ficha), **Instagram/otros** → tarea manual; **triggers** opcionales en `FollowUpPlan` (score, etapas) F2-E5; ver `docs/decisions/slice-follow-up-channels-email-manual.md`. |
| **WhatsApp** | Entrada: webhook `/api/webhooks/whatsapp`; `slice-s08`. Saliente: `POST /api/whatsapp/send` (admin), Graph API; `slice-s09`. |
| **IA conversacional (base)** | `POST /api/ai/conversation/next-action` (admin/coordinator); proveedor dual S10; reglas handoff + versionado prompt S11 (`slice-s11-conversational-handoff-rules.md`). |
| **Dashboard (F1-E16)** | KPIs + **S33** en `/dashboard` + **S34/L3** en **`/dashboard/reportes`**: nuevos 7d por canal, embudo conversacional y **comercial**, **SLA** (mediana/promedio minutos primera respuesta en ventana UTC), tareas/seg. activos, **CSV** vía `GET /api/exports/operational-reports` (`slice-s23`, `slice-s33`, `slice-s34`, `slice-l3`). |
| **Auditoría** | `recordAuditEvent` + evento `session_started` en login + evento de seed; UI admin (`/dashboard/audit`). |
| **Captura (API)** | `POST /api/contacts/create` con **Bearer** = `CAPTURE_API_SECRET` global **o** API key por tenant `kp_…` (F3-E2); `accountSlug` o `accountId`; validación + rate limit por IP; `lead_captured` (S28). **OpenAPI:** `/openapi-capture-v1.yaml` (L11). **Meta Lead Ads:** `GET/POST /api/webhooks/meta-leads` + `Integration` `meta_lead_ads` (`slice-f2-mvp-completion.md`). |
| **Captura (formulario)** | `/lead` opcional con `ENABLE_PUBLIC_LEAD_FORM=true`; misma lógica vía server action (auditoría `via: public_lead_form`). |
| **Captura (widget)** | `kite-lead-widget.js` → iframe `/embed/lead`; canal `web_widget`; ver `docs/capture-integration.md`. |
| **Captura (landings)** | Patrones unificados + ejemplos copy-paste: `docs/capture-integration.md` §4, `docs/examples/`. |
| **Matching v0 / F2-E2** | Reglas sobre inventario `available` + `syncPropertyMatchesForContact` (**pesos** por cuenta, **feedback** `PropertyMatch`, **exclusiones** por perfil, sync `rulesVersion` v1, L5); UI recalcular en ficha; envío por WhatsApp con `Recommendation` (S20); tests Vitest; `slice-s04-matching-v0.md`, `slice-l5-f2e2-matching-weights-feedback-exclusions.md`, `slice-s20-property-recommendation-whatsapp.md`. |

## Plan de trabajo actual

**Fase 1 (código):** los hitos S01–S30 y L1 están cerrados en `docs/execution-plan-sprints.md`. **S31** refuerza diagnóstico de producción vía `/api/health`. **L2 / S33–S34:** `/dashboard` operativo, filtros en `/dashboard/properties` (`slice-s33`), **`/dashboard/reportes`** y badge de **canal** en lista de contactos (`slice-s34`). **L3:** mismos reportes ampliados con **SLA primera respuesta**, **embudo comercial** y **export CSV** autenticado (`slice-l3-f2e7-sla-export-commercial-funnel.md`). **L4:** **F2-E1** (paso) — perfil **inferido** (`SearchProfile` `source=inferred`, heurísticas sobre mensajes entrantes), **prioridad declarado > inferido** en matching/scoring; UI en `/dashboard/contacts/[id]/profile` (`slice-l4-f2e1-inferred-profile-heuristics.md`). **L5:** **F2-E2** — pesos de matching en cuenta, feedback en matches y exclusiones por perfil (`slice-l5-f2e2-matching-weights-feedback-exclusions.md`).

**L6 / Fase 2 (MVP técnico):** **F2-E3** orden de matches con desempate; **F2-E4** reactivación por nueva propiedad (API + feed) → tareas CRM; **F2-E5** triggers en planes de seguimiento evaluados en cron; **F2-E1** refinamiento LLM opcional (`SEARCH_PROFILE_INFER_LLM`); **F2-E6** webhook Meta Lead Ads (`/api/webhooks/meta-leads`, canal `meta_lead`); **F2-E7** alineado a reportes L2/L3. Detalle: `docs/decisions/slice-f2-mvp-completion.md`.

**Producción operativa:** variables en Vercel/hosting, Meta, Resend e IA siguen en **`docs/manual-actions-required.md`** y **`docs/produccion-checklist-usuario.md`** (primera URL pública, `AUTH_URL`, demo seed vía `build:vercel`, etc.).

**Entorno dev (Git):** `docs/decisions/github-ssh-windows-dev.md`; checklist humano ítem 11 en `docs/manual-actions-required.md`.

**Remotes (alineado):** `origin` → [TeknoAriel/KiteProspect](https://github.com/TeknoAriel/KiteProspect) (Vercel + push diario); `kiteprop` → org `kiteprop/ia-kiteprospects` (auditoría); `docs/decisions/git-dual-remote-tekno-kiteprop.md`.

## Pendiente respecto a Fase 1 (producto)

Definido en `PRODUCT_DEFINITION.md` y **aún no** cerrado como slice completo:

- WhatsApp: webhook + envío **implementados**; desde inbox (S12) coordinador/admin puede enviar borrador IA; plantillas Meta / políticas 24 h si se priorizan.
- Motor conversacional: S10–S12; **envío totalmente automático** del borrador sin humano sigue fuera del MVP intencionalmente.
- Jobs (BullMQ) para seguimiento automático **no** implementados a propósito en MVP (evitar automatización prematura).

## Bloqueado por acción manual

Ver **`docs/manual-actions-required.md`**: PostgreSQL, `.env` (`DATABASE_URL`, `AUTH_SECRET`), migraciones/reset si el esquema cambió.

## TODO explícito Fase 2+

- **F2-E1** — perfil inferido con **LLM** (merge, conflictos) y/o re-inferencia automática acotada.
- Resolver tenant por subdomain además de slug en login.
- OAuth, reset de contraseña, permisos granulares.
- CRUD UI adicional para otras entidades (tareas, notas, etc.; sin convertir en CRM enterprise).
