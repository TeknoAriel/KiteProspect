# Estado del MVP (Fase 1) — snapshot

Documento vivo: refleja lo **implementado** en código frente al alcance de `PRODUCT_DEFINITION.md` (sin prometer features fuera).

## Implementado (técnico)

| Área | Qué hay |
|------|---------|
| **Multi-tenant** | Datos filtrados por `accountId` de sesión; login con **slug de cuenta** + email + contraseña. |
| **Auth** | NextAuth (credenciales), JWT, `SessionProvider`, `/dashboard/*` protegido en Edge con `getToken` (`@auth/core/jwt`, sin bcrypt en middleware). |
| **Usuarios / asesores / cuentas** | Vistas de lectura en dashboard (`/dashboard/users`, `advisors`, `accounts`). |
| **CRM básico** | Lista y ficha de contacto (`/dashboard/contacts`, `/dashboard/contacts/[id]`). |
| **Inbox** | Lista unificada de conversaciones activas (`/dashboard/inbox`). |
| **Perfil declarado** | Página dedicada (`/dashboard/contacts/[id]/profile`). |
| **Scoring** | Reglas MVP + recálculo seguro con `accountId` (`/dashboard/contacts/[id]/score`). |
| **Seguimiento** | Lectura de planes y secuencias (`/dashboard/followups`). |
| **Dashboard** | KPIs básicos + navegación. |
| **Auditoría** | `recordAuditEvent` + evento `session_started` en login + evento de seed; UI admin (`/dashboard/audit`). |
| **Captura (API)** | `POST /api/contacts/create` con `CAPTURE_API_SECRET` + `accountSlug` (o `accountId`), email o teléfono; evento `lead_captured`. |
| **Captura (formulario)** | `/lead` opcional con `ENABLE_PUBLIC_LEAD_FORM=true`; misma lógica vía server action (auditoría `via: public_lead_form`). |

## Pendiente respecto a Fase 1 (producto)

Definido en `PRODUCT_DEFINITION.md` y **aún no** cerrado como slice completo:

- Widget web, script embebido en landing (UI/SDK); guía de integración: **`docs/capture-integration.md`**.
- WhatsApp base (webhook/envío).
- Motor conversacional asistido (IA estructurada).
- Jobs (BullMQ) para seguimiento automático **no** implementados a propósito en MVP (evitar automatización prematura).

## Bloqueado por acción manual

Ver **`docs/manual-actions-required.md`**: PostgreSQL, `.env` (`DATABASE_URL`, `AUTH_SECRET`), migraciones/reset si el esquema cambió.

## TODO explícito Fase 2+

- Resolver tenant por subdomain además de slug en login.
- OAuth, reset de contraseña, permisos granulares.
- CRUD UI para entidades clave (sin convertir en CRM enterprise).
