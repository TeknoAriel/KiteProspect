# L14 / F3-E3 — Webhooks públicos salientes (MVP)

**Fecha:** 2026-04-06  
**Estado:** implementado (MVP).

## Contexto

`docs/roadmap.md` F3-E3: webhooks públicos (eventos de lead, mensaje, asignación). Tras F3-E2 (API keys captura) y OpenAPI, el siguiente paso natural es permitir que un **tenant** registre **URLs HTTPS** y reciba **notificaciones firmadas** sin implementar aún F3-E1 (CRM externo / sync bidireccional).

## Decisión

1. **Modelo `WebhookSubscription`** (Prisma): `accountId`, `url`, `signingSecret`, `events` (JSON array), `revokedAt`. El secreto se genera al crear (`kws_` + hex), se muestra **una sola vez** al usuario y se persiste **en claro** en BD para poder calcular HMAC en cada entrega (MVP). La base debe estar protegida (misma política que `DATABASE_URL`).

2. **Eventos v1:** `lead.captured` (tras captura exitosa vía `createLeadCapture`), `contact.assignment_changed` (tras `PATCH` de asignación en ficha). Ampliar la lista en versiones posteriores con nueva migración o convención de nombres.

3. **Contrato HTTP:** `POST` al `url` registrado, cuerpo JSON:

   ```json
   {
     "event": "lead.captured",
     "accountId": "…",
     "occurredAt": "2026-04-06T…Z",
     "data": { … }
   }
   ```

   Cabeceras: `Content-Type: application/json; charset=utf-8`, `X-Kite-Event`, `X-Kite-Delivery-Id` (UUID), `X-Kite-Signature: sha256=<hex>` donde `<hex>` = HMAC-SHA256 del **cuerpo exacto** enviado (mismo string UTF-8 que el body), clave = `signingSecret`.

4. **URL permitida:** `https` obligatorio en entornos reales; `http` solo `localhost` / `127.0.0.1` para pruebas locales.

5. **Entrega:** en la misma ejecución serverless, `fetch` con timeout 8s; fallos se registran con `logStructured` / consola. **No** cola persistente ni reintentos en este MVP (Fase 2 si hace falta).

6. **API admin:** `GET/POST /api/account/webhook-subscriptions`, `DELETE /api/account/webhook-subscriptions/[id]` (revocar). Solo rol `admin`.

7. **UI:** `/dashboard/account/webhooks`.

## Alternativas descartadas

- **Solo `Account.config`:** menos consultable y sin índices claros por tenant.
- **Cifrado del secreto en app:** deseable en Fase 2; no bloquea MVP si la BD está acotada.
- **Eventos síncronos bloqueando captura:** descartado; errores del destino no deben fallar la captura.

## Referencias

- `docs/product-rules.md` — sección webhooks.
- `docs/status-mvp.md`
