# Decisiones — endurecimiento MVP (sesión avance)

## Middleware solo en `/dashboard`

**Implementado:** El matcher limita la protección a `/dashboard/:path*`.

**Razón:** La landing pública (`/`) y `/login` deben ser accesibles sin sesión; encaja con producto SaaS (marketing mínimo + panel).

## Login con slug de cuenta

**Implementado:** Credencial `accountSlug` + búsqueda `Account` → `User` con `@@unique([accountId, email])`.

**Razón:** Evita ambigüedad si el mismo email existiera en dos tenants (aunque sea poco frecuente, el modelo lo permite a nivel global).

**Fase 2:** Subdomain → slug automático.

## SessionProvider

**Implementado:** `next-auth/react` `SessionProvider` en el layout raíz.

**Razón:** `signIn` desde el cliente requiere contexto de sesión estable.

## Scoring y tenant

**Implementado:** `calculateLeadScore(contactId, accountId)` con `findFirst` donde `id` y `accountId` coinciden. Server action `recalculateContactScoreAction` obtiene `accountId` de la sesión.

**Razón:** Las server actions no deben confiar solo en `contactId` (IDOR).

## Auditoría

**Implementado:** `lib/audit.ts` + evento `session_started` en `signIn` + evento `seed_demo_applied` en seed.

**Razón:** Trazabilidad mínima sin instrumentar todo el CRM.

**Fase 2:** Auditar cambios de pipeline, asignaciones, mensajes salientes, etc.

## trustHost

**Implementado:** `trustHost: true` en NextAuth.

**Razón:** Desarrollo local y despliegues detrás de proxy; en producción revisar `AUTH_URL` / host según proveedor.
