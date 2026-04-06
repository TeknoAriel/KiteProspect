# Slice L11 — OpenAPI 3.0 para captura pública (`POST /api/contacts/create`)

**Fecha:** 2026-04-04  
**Referencias:** F3-E2 (APIs documentadas — paso mínimo sin API keys por tenant).

## Contexto

La captura HTTP estaba documentada en Markdown (`docs/capture-integration.md`) sin contrato máquina-legible. F3-E2 pide OpenAPI o equivalente.

## Decisión

1. **Artefacto canónico:** `apps/web/public/openapi-capture-v1.yaml` — servido en producción como `GET /openapi-capture-v1.yaml` (archivo estático Next.js `public/`).

2. **Alcance v1:** solo `POST /api/contacts/create` (auth Bearer / `X-Capture-Secret`, cuerpo JSON, códigos 200/400/401/404/429/500/503 alineados al código actual).

3. **No incluye en L11:** API keys por tenant (sigue backlog), inventario público, otros endpoints.

4. **Prueba mínima:** Vitest lee el archivo desde `public/` y valida presencia de `openapi: 3.x` y path.

## Consecuencias

- Integradores pueden importar el YAML en Postman, Redocly, etc.
- Cualquier cambio de contrato en `route.ts` / `create-lead-capture` debe reflejarse en el YAML (revisión en PR).
