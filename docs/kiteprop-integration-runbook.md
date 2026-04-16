# Runbook: integración KiteProp (handoff + operación)

## Variables por entorno

| Variable | Uso |
|----------|-----|
| `KITEPROP_HANDOFF_URL` | URL base del receptor `lead.qualified` (staging acordado). |
| `KITEPROP_HANDOFF_MOCK_URL` | Alternativa explícita mock/local. |
| `KITEPROP_HANDOFF_HMAC_SECRET` | Secreto HMAC global. |
| `KITEPROP_HANDOFF_HMAC_SECRET_<SLUG>` | Override por cuenta (`slug` en mayúsculas, guiones → `_`). |
| `REDIS_URL` | Colas BullMQ para handoff asíncrono (producción). Sin Redis, el job corre inline en el proceso que despacha. |
| `INTERNAL_OPS_SECRET` o `CRON_SECRET` | Autenticación de APIs `/api/internal/activation/*`. |
| `HANDOFF_INTEGRATION_E2E` | `1` solo para ejecutar tests E2E de handoff contra Postgres (local/CI con DB). |

Opcional en `Account.config`: `kitepropHandoffUrl` por tenant (prioridad sobre env global).

## Checklist de puesta en marcha

1. Migraciones aplicadas (`HandoffOutboundAttempt.requestPayloadSnapshot`, etc.).
2. `KITEPROP_HANDOFF_URL` + HMAC alineados con el entorno KiteProp acordado.
3. `INTERNAL_OPS_SECRET` definido en Vercel para herramientas internas.
4. Redis + worker (`npm run worker`) si se usa cola (recomendado fuera de serverless puro).
5. Prueba manual: cualificar un lead de prueba y verificar auditoría `lead_handed_off` y fila sin errores en `handoffs-failed`.

## APIs internas (Bearer `INTERNAL_OPS_SECRET`)

| Método y ruta | Descripción |
|---------------|-------------|
| `GET /api/internal/activation/leads-qualified-pending` | Leads `qualified` (pendientes de handoff o en curso). Query: `limit`, `accountId`. |
| `GET /api/internal/activation/handoffs-failed` | `qualified` con intentos sin ACK y sin ningún ACK previo. Query: `limit`, `accountId`. |
| `GET /api/internal/activation/handoff-last-attempt?leadId=` | Último intento: `requestPayloadSnapshot`, `responseSnippet`, `httpStatus`, `ok`. |
| `POST /api/internal/activation/handoff-retry` | Body `{ "leadId": "..." }` — encola handoff con **jobId nuevo** (`replay: true`). |
| `GET /api/internal/activation/handoffs` | Historial de intentos (lista). |
| `POST /api/internal/activation/retry-failed` | Reintenta jobs fallidos de una cola BullMQ (genérico). |

## Validación manual (controlado)

1. Crear/captar lead y llevarlo a `qualified` (reglas o override manual).
2. Confirmar en logs estructurados `kiteprop_handoff_attempt` (status, `ack`, `latencyMs`, `requestSha256`).
3. Verificar `Lead.status === handed_off` tras ACK.
4. En KiteProp/staging, confirmar recepción del evento y deduplicación con reenvío (409 esperado como ACK en Prospect).

## Replay de fallos

1. **5xx / red**: el job reintenta solo; si agota intentos, usar `POST /api/internal/activation/retry-failed` o `handoff-retry` puntual (nuevo `jobId`).
2. **422**: corregir datos en Prospect (p. ej. contacto); luego `POST /api/internal/activation/handoff-retry` con `leadId` (no reintenta automáticamente por `UnrecoverableError`).
3. **409**: tratado como éxito; si el lead no pasó a `handed_off` por condición de carrera, el siguiente job o `lastSuccess` en procesador puede sincronizar (ver código).

## Tests E2E (Postgres)

No forman parte del `npm run test` por defecto.

```bash
HANDOFF_INTEGRATION_E2E=1 dotenv -e .env -- npm run test -w @kite-prospect/web -- integration-outbound-processor.handoff.e2e
```

Requiere cuenta `demo` en seed y migraciones aplicadas. Redis **no** es obligatorio para estos tests (ejecutan el procesador en proceso).

## Riesgos residuales (corto)

- **Multi-instancia serverless**: sin Redis, el handoff inline puede duplicar esfuerzos bajo carrera; Redis + un worker reduce el riesgo.
- **Datos históricos**: intentos previos al cambio de semántica `ok` = ACK pueden mostrar `ok: false` para 409; nuevos registros son coherentes.
- **Truncado**: `requestPayloadSnapshot` y `responseSnippet` están acotados por tamaño; no sustituyen log completo en el receptor.
