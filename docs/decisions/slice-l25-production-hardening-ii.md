# L25 — Alta producción II (HSTS Vercel, robots, security.txt)

## Contexto

Continuación transversal de `docs/roadmap.md` (observabilidad / endurecimiento) tras L23.

## Decisión

1. **`Strict-Transport-Security`** en `next.config.mjs` solo cuando el build tiene `VERCEL=1` (despliegue Vercel). Evita forzar HSTS en `next start` local u otros hosts donde HTTP sigue siendo válido para pruebas.
2. **`poweredByHeader: false`** — oculta `X-Powered-By: Next.js` (higiene; no es control de seguridad por sí solo).
3. **`src/app/robots.ts`** — `Disallow: /dashboard/, /api/` para crawlers; rutas públicas relevantes (`/`, `/lead`, `/embed`, OpenAPI estática) siguen permitidas.
4. **`public/.well-known/security.txt`** — contacto de reporte vía GitHub Security (RFC 9116); el operador del tenant puede sustituir el archivo en forks o proxy si usa otro canal.

## Límites

- HSTS depende del build en Vercel; previews/staging en el mismo proyecto también lo reciben (comportamiento deseable en HTTPS).
- No se añade rate limit por IP a webhooks Meta: el tráfico legítimo puede concentrarse en pocas IPs.

## Referencias

- `docs/decisions/slice-l23-production-hardening.md`
- `docs/decisions/slice-l26-production-hardening-iii.md`
