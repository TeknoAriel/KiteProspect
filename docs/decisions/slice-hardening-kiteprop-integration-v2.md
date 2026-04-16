# Endurecimiento activación + integración KiteProp (handoff real)

## Implementado

1. **Consentimiento en captura**  
   - `consentMarketing` sin valor ya **no** implica opt-in fuera de dev/preview.  
   - En producción (`NODE_ENV=production` y `VERCEL_ENV=production`) hace falta `consentMarketing: true` explícito **o** `ALLOW_IMPLICIT_CONSENT_DEFAULT=true`.  
   - `resolveConsentMarketingInput` + `runtime-env.ts`.

2. **Idempotencia ingesta**  
   - Carrera en clave única `IngestionIdempotencyKey`: captura `P2002` y devuelve resultado deduplicado.

3. **Doble qualify / handed_off**  
   - Cualificación: `updateMany` con `status: open` → una sola fila pasa a `qualified` antes de crear `LeadQualification` (con `leadId`).  
   - Handoff: `updateMany` con `status: qualified` → `handed_off`; registro en `HandoffOutboundAttempt` con request/response/latencia; `event_id` y `occurred_at` **determinísticos** por `dedupe_key` para reintentos con mismo cuerpo firmado.  
   - Cola `integration-outbound`: `jobId` estable `handoff:{accountId}:{leadId}` para deduplicar encolados.

4. **Adaptador KiteProp**  
   - `sendLeadQualifiedToKiteprop` (`kiteprop-lead-qualified-adapter.ts`).  
   - URL: `Account.config.kitepropHandoffUrl` → `KITEPROP_HANDOFF_URL` → `KITEPROP_HANDOFF_MOCK_URL` → solo en dev/preview default mock local.  
   - Firma: `resolveHandoffSigningSecretForAccount` (global + `KITEPROP_HANDOFF_HMAC_SECRET_<SLUG>`).

5. **Observabilidad (API interna)**  
   - Auth: `Authorization: Bearer INTERNAL_OPS_SECRET` o `CRON_SECRET` si no hay el primero.  
   - Rutas: `/api/internal/activation/summary`, `handoffs`, `qualifies`, `metrics`, `retry-failed` (POST).

6. **Entorno**  
   - `instrumentation.ts` + `validateServerEnvOrThrow`: en producción exige `DATABASE_URL`, `AUTH_SECRET`, y secreto HMAC salvo `KITEPROP_SKIP_PRODUCTION_HMAC_CHECK=true` (migración).

7. **Tests**  
   - Determinismo handoff, URL tenant, canal WA→email/manual, consent explícito.

## Inconsistencia corregida (reglas / trazabilidad)

- Antes: `event_id` aleatorio en cada intento → reintentos con distinto cuerpo respecto al primero.  
- Ahora: `event_id` y `occurred_at` derivados de `dedupe_key`, alineado a “reintentos con mismo cuerpo lógico” + HMAC estable.

## Pendiente real

- UI admin para `Account.config.kitepropHandoffUrl` sin editar JSON a mano.  
- Métricas Prometheus / OpenTelemetry (hoy agregados vía BD + colas).  
- Prueba E2E con Postgres + Redis en CI.
