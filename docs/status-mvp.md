# Estado del MVP (Fase 1) — snapshot

Documento vivo: refleja lo **implementado** en código frente al alcance de `PRODUCT_DEFINITION.md` (sin prometer features fuera).

## Implementado (técnico)

| Área | Qué hay |
|------|---------|
| **Multi-tenant** | Datos filtrados por `accountId` de sesión; login con **slug de cuenta** + email + contraseña. |
| **Configuración cuenta (F1-E2 MVP)** | Centro admin `/dashboard/account` (módulos, conexión Vercel, endpoints, IA, seguimientos) + ajustes generales + prompt IA + edición planes de seguimiento (`/dashboard/account/follow-up-plans`) + feeds inventario (`/dashboard/account/property-feeds`); S13, S17, S21, S22. |
| **Inventario propiedades (F1-E4)** | ABM `/dashboard/properties` + API; mutaciones admin/coordinator; lectura asesor; ingesta KiteProp XML/JSON + cron + sync manual (`slice-s22-kiteprop-property-feed.md`); `slice-s14-properties-abm.md`. |
| **Auth** | NextAuth (credenciales), JWT, `SessionProvider`, `/dashboard/*` protegido con `auth()` en middleware (Auth.js v5). |
| **Usuarios (F1-E3)** | ABM de usuario por tenant en `/dashboard/users` + API; hash bcrypt en alta/edición; no borrar usuario autenticado; `slice-s15-users-abm.md`. |
| **Asesores (F1-E3)** | ABM `/dashboard/advisors` + API; vínculo opcional usuario del tenant (un usuario → un asesor); `slice-s16-advisors-abm.md`. |
| **Cuentas** | Vista de lectura admin (`/dashboard/accounts`). |
| **CRM básico** | Lista y ficha de contacto (`/dashboard/contacts`, `/dashboard/contacts/[id]`). |
| **Inbox** | Lista (`/dashboard/inbox`) con filtros (S18), búsqueda y paginación (S19) + hilo (`/dashboard/inbox/[id]`) con asistencia IA y envío manual del borrador por WhatsApp (S12). |
| **Perfil declarado** | Página dedicada (`/dashboard/contacts/[id]/profile`). |
| **Scoring** | Reglas MVP + recálculo seguro con `accountId` (`/dashboard/contacts/[id]/score`). |
| **Seguimiento** | Lectura de planes y secuencias (`/dashboard/followups`). |
| **Seguimiento (jobs)** | Cron `GET /api/cron/follow-up-due` + `processDueFollowUps`; envío **WhatsApp** cuando el paso es `channel: whatsapp` (Meta en env); email u otros canales pendientes. |
| **WhatsApp** | Entrada: webhook `/api/webhooks/whatsapp`; `slice-s08`. Saliente: `POST /api/whatsapp/send` (admin), Graph API; `slice-s09`. |
| **IA conversacional (base)** | `POST /api/ai/conversation/next-action` (admin/coordinator); proveedor dual S10; reglas handoff + versionado prompt S11 (`slice-s11-conversational-handoff-rules.md`). |
| **Dashboard (F1-E16)** | KPIs por tenant: nuevos contactos (7 días), conversaciones abiertas vs total, propiedades disponibles, tabla pipeline por `commercialStage` (`slice-s23-dashboard-kpis.md`); navegación. |
| **Auditoría** | `recordAuditEvent` + evento `session_started` en login + evento de seed; UI admin (`/dashboard/audit`). |
| **Captura (API)** | `POST /api/contacts/create` con `CAPTURE_API_SECRET` + `accountSlug` (o `accountId`), email o teléfono; validación de campos + rate limit por IP (memoria); evento `lead_captured`. |
| **Captura (formulario)** | `/lead` opcional con `ENABLE_PUBLIC_LEAD_FORM=true`; misma lógica vía server action (auditoría `via: public_lead_form`). |
| **Captura (widget)** | `kite-lead-widget.js` → iframe `/embed/lead`; canal `web_widget`; ver `docs/capture-integration.md`. |
| **Captura (landings)** | Patrones unificados + ejemplos copy-paste: `docs/capture-integration.md` §4, `docs/examples/`. |
| **Matching v0** | Reglas sobre inventario `available` + `syncPropertyMatchesForContact`; UI recalcular en ficha; envío por WhatsApp con `Recommendation` (S20); `slice-s04-matching-v0.md`, `slice-s20-property-recommendation-whatsapp.md`. |

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
