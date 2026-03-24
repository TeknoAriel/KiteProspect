# Estado del MVP (Fase 1) — snapshot

Documento vivo: refleja lo **implementado** en código frente al alcance de `PRODUCT_DEFINITION.md` (sin prometer features fuera).

## Implementado (técnico)

| Área | Qué hay |
|------|---------|
| **Multi-tenant** | Datos filtrados por `accountId` de sesión; login con **slug de cuenta** + email + contraseña. |
| **Auth** | NextAuth (credenciales), JWT, `SessionProvider`, `/dashboard/*` protegido con `auth()` en middleware (Auth.js v5). |
| **Usuarios / asesores / cuentas** | Vistas de lectura en dashboard (`/dashboard/users`, `advisors`, `accounts`). |
| **CRM básico** | Lista y ficha de contacto (`/dashboard/contacts`, `/dashboard/contacts/[id]`). |
| **Inbox** | Lista unificada de conversaciones activas (`/dashboard/inbox`). |
| **Perfil declarado** | Página dedicada (`/dashboard/contacts/[id]/profile`). |
| **Scoring** | Reglas MVP + recálculo seguro con `accountId` (`/dashboard/contacts/[id]/score`). |
| **Seguimiento** | Lectura de planes y secuencias (`/dashboard/followups`). |
| **Seguimiento (jobs)** | Cron `GET /api/cron/follow-up-due` + `processDueFollowUps`; `slice-s06` + `slice-s07`; envío real de canales pendiente. |
| **WhatsApp (entrada)** | Webhook `/api/webhooks/whatsapp`; ingest + opt-out; `slice-s08-whatsapp-webhook.md`. Envío saliente: S09. |
| **Dashboard** | KPIs básicos + navegación. |
| **Auditoría** | `recordAuditEvent` + evento `session_started` en login + evento de seed; UI admin (`/dashboard/audit`). |
| **Captura (API)** | `POST /api/contacts/create` con `CAPTURE_API_SECRET` + `accountSlug` (o `accountId`), email o teléfono; validación de campos + rate limit por IP (memoria); evento `lead_captured`. |
| **Captura (formulario)** | `/lead` opcional con `ENABLE_PUBLIC_LEAD_FORM=true`; misma lógica vía server action (auditoría `via: public_lead_form`). |
| **Captura (widget)** | `kite-lead-widget.js` → iframe `/embed/lead`; canal `web_widget`; ver `docs/capture-integration.md`. |
| **Captura (landings)** | Patrones unificados + ejemplos copy-paste: `docs/capture-integration.md` §4, `docs/examples/`. |
| **Matching v0** | Reglas sobre inventario `available` + `syncPropertyMatchesForContact`; UI recalcular en ficha; `docs/decisions/slice-s04-matching-v0.md`. |

## Pendiente respecto a Fase 1 (producto)

Definido en `PRODUCT_DEFINITION.md` y **aún no** cerrado como slice completo:

- WhatsApp base (webhook/envío).
- Motor conversacional asistido (IA estructurada).
- Jobs (BullMQ) para seguimiento automático **no** implementados a propósito en MVP (evitar automatización prematura).

## Bloqueado por acción manual

Ver **`docs/manual-actions-required.md`**: PostgreSQL, `.env` (`DATABASE_URL`, `AUTH_SECRET`), migraciones/reset si el esquema cambió.

## TODO explícito Fase 2+

- Resolver tenant por subdomain además de slug en login.
- OAuth, reset de contraseña, permisos granulares.
- CRUD UI para entidades clave (sin convertir en CRM enterprise).
