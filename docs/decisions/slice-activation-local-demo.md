# Activación local: colas BullMQ + demo

## Implementado

- Modelos Prisma: `Lead`, `ChannelState`, `IngestionIdempotencyKey`; `Conversation.leadId`, `LeadScore.leadId`; índice único parcial Postgres: un solo lead `open`/`qualified` por contacto.
- Redis + BullMQ: colas `ingestion`, `scoring`, `followup`, `orchestration`, `integration-outbound`, `dlq`; worker `npm run worker -w @kite-prospect/web`.
- Ingesta: `POST /api/lead` (Idempotency-Key), webhooks existentes WA + `POST /api/webhooks/campaigns/mock`.
- Scoring con pesos 0.3 / 0.2 / 0.3 / 0.2; pipeline cualificación Q1–Q8 / E1–E3; handoff mock `POST /api/mock/kiteprop-handoff` con `X-Kite-Signature` (HMAC-SHA256 del body).
- Sin `REDIS_URL`, los jobs se ejecutan **en línea** (mismo proceso Node) para desarrollo sin Redis.

## Pendiente

- UI dedicada al motor de activación; seguimiento real en cola `followup` (hoy no-op).
- Reintentos hacia KiteProp real y contrato firmado con el equipo CRM.

## Manual / local

1. `pnpm demo:up` o `npm run demo:up` → levanta Redis (`docker-compose.demo.yml`).
2. En `.env`: `REDIS_URL=redis://127.0.0.1:6379`, `DATABASE_URL`, `CAPTURE_API_SECRET`, opcional `KITEPROP_HANDOFF_MOCK_URL`, `KITEPROP_HANDOFF_HMAC_SECRET`, `INTERNAL_OPS_SECRET` (APIs internas).
3. `npm run db:migrate` y `npm run db:seed` (incluye `activation-seed@demo.local`).
4. Terminal A: `npm run dev`; Terminal B: `npm run worker`.
5. Observabilidad: `GET /api/internal/activation/summary` con `Authorization: Bearer <INTERNAL_OPS_SECRET>` (ver `docs/activation-validation-checklist.md`).
6. Probar captura:

```bash
curl -sS -X POST "http://localhost:3000/api/lead" \
  -H "Authorization: Bearer TU_CAPTURE_SECRET" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: demo-$(date +%s)" \
  -d '{"accountSlug":"demo","email":"prueba-activacion@local.test","name":"Demo","message":"Hola, busco comprar","consentMarketing":true}'
```

El mock de handoff debe recibir el POST cuando el lead califica y el worker procesa `integration-outbound`.
