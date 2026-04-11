# L23 — Sprint alta producción (cabeceras, health, rate limit auth)

## Contexto

Backlog transversal en `docs/roadmap.md`: observabilidad y endurecimiento operativo sin convertir el producto en plataforma enterprise.

## Decisión

1. **Cabeceras HTTP** (`next.config.mjs`):
   - Global: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` mínima (cámara/micrófono/geolocalización desactivados en iframe).
   - **Dashboard:** `X-Frame-Options: DENY` (el embed `/embed/*` sigue con CSP `frame-ancestors *` y **no** recibe DENY).
2. **Middleware:** matcher incluye `/api/auth/:path*`; en **POST** aplica límite suave por IP con `allowRateLimitWithConfig` + `getAuthRateLimitConfig` (`AUTH_RATE_LIMIT_MAX` default 20, `AUTH_RATE_LIMIT_WINDOW_SEC` default 60). Respuesta **429** + `Retry-After`.
3. **`GET /api/health`:** `deploy.vercelEnv`, `deploy.deploymentId` (variables Vercel si existen); `demoAdvisorUser` + issue `falta_usuario_asesor_demo` si falta el usuario asesor del seed (L21).

## Límites

- Rate limit en memoria: en serverless hay varias instancias; es **freno suave** (igual que captura). Para límites globales estrictos, Edge/KV (Upstash, etc.) queda fuera de alcance.

## Referencias

- `docs/decisions/slice-s31-production-readiness-health.md`
- `docs/manual-actions-required.md`
