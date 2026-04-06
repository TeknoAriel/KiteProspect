# Slice L9 — Firma webhook Meta Lead Ads + UI integraciones (lectura)

**Fecha:** 2026-04-04  
**Referencias:** F2-E6 (Meta Lead Ads), F1-E2 (hub cuenta).

## Contexto

El endpoint `POST /api/webhooks/meta-leads` aceptaba cualquier cuerpo JSON sin validar origen. En producción conviene alinear el comportamiento al de otros webhooks Meta (`X-Hub-Signature-256` con App Secret).

## Decisión

1. **HMAC opcional:** Si `META_LEAD_WEBHOOK_APP_SECRET` está definido en el entorno, el POST exige cabecera `X-Hub-Signature-256` con valor `sha256=<hex>` donde `hex = HMAC-SHA256(app_secret, raw_body_utf8)` (mismo esquema que Graph webhooks). Si la variable **no** está definida, el comportamiento anterior se mantiene (útil para desarrollo local sin secret compartido con Meta).

2. **Lectura en UI:** Página admin `/dashboard/account/integrations` lista `Integration` del tenant con resumen no sensible (`type`, `status`, `pageId` para `meta_lead_ads`). No se muestra `config` completo ni tokens.

3. **Utilidad pura + tests:** `verify-meta-webhook-signature.ts` + Vitest con cuerpo y firma de prueba.

## Consecuencias

- Operaciones deben configurar `META_LEAD_WEBHOOK_APP_SECRET` en Vercel igual al App Secret de la app Meta usada para Lead Ads si quieren rechazar tráfico no firmado.
- `docs/manual-actions-required.md` §6b actualizado con este paso opcional pero recomendado.
