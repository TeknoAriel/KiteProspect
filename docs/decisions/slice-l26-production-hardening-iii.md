# L26 — Alta producción III (health sin caché, payload runtime/security)

## Contexto

Completar el diagnóstico público `GET /api/health` para operación y CDNs sin ampliar PII.

## Decisión

1. **Cabeceras** en respuestas JSON de `/api/health`: `Cache-Control: no-store, must-revalidate` y `Pragma: no-cache` (éxito y error 503) para que proxies no sirvan un estado viejo de BD o flags.
2. **Payload** (sin secretos):
   - `runtime`: `nodeEnv`, `vercel` (boolean, `VERCEL=1`).
   - `security`: `hsts` (true en Vercel, alineado a L25), `poweredByHeaderDisabled: true` (documenta configuración Next; no sustituye inspección de cabeceras HTTP).

## Límites

- `poweredByHeaderDisabled` es informativo; si la capa delante añade cabeceras, el cliente debe verificar con herramientas de red.

## Referencias

- `docs/decisions/slice-s31-production-readiness-health.md`
- `docs/decisions/slice-l25-production-hardening-ii.md`
