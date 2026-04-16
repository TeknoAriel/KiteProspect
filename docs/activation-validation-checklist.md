# Checklist de validación — activación + KiteProp

Usar tras desplegar o antes de cortar a producción con KiteProp real.

## Entorno

- [ ] `DATABASE_URL`, `AUTH_SECRET` definidos.
- [ ] `KITEPROP_HANDOFF_HMAC_SECRET` (o `KITEPROP_HANDOFF_SIGNING_SECRET`) definido, **o** `KITEPROP_SKIP_PRODUCTION_HMAC_CHECK=true` solo durante migración.
- [ ] `KITEPROP_HANDOFF_URL` **o** `Account.config.kitepropHandoffUrl` por tenant apuntando al receptor acordado (staging/producción según política).
- [ ] `REDIS_URL` en el entorno que ejecuta workers.
- [ ] `INTERNAL_OPS_SECRET` (o reutilizar `CRON_SECRET`) para APIs `/api/internal/activation/*`.

## Comportamiento

- [ ] `POST /api/lead` en producción **sin** `consentMarketing: true` **no** crea consentimiento (salvo flags de demo/preview).
- [ ] Misma `Idempotency-Key` → misma respuesta deduplicada, sin segundo lead activo.
- [ ] Tras cualificar, aparece fila en `HandoffOutboundAttempt` con `httpStatus` y `latencyMs`.
- [ ] Handoff exitoso → `Lead.status = handed_off` una sola vez (reintentos no duplican estado).
- [ ] `GET /api/internal/activation/summary` con Bearer devuelve conteos de colas.

## KiteProp / receptor

- [ ] Receptor valida `X-Kite-Signature` sobre el body exacto (hex tras `sha256=`).
- [ ] Receptor trata `dedupe_key` como idempotencia de negocio.

## Dev / staging / prod

| Aspecto | Local | Preview Vercel | Producción |
|--------|--------|------------------|------------|
| Default consent implícito | Sí (NODE_ENV=development) | Sí (`VERCEL_ENV=preview`) | No (salvo `ALLOW_IMPLICIT_CONSENT_DEFAULT`) |
| URL handoff por defecto | Mock localhost si no hay env | Config/env | **Solo** env o `Account.config` |
| Validación env estricta | No | Opcional | Sí (`instrumentation`) |
