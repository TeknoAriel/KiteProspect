# Decisión: endurecimiento API `POST /api/contacts/create`

## Contexto

Existía un endpoint MVP que aceptaba `accountId` en el cuerpo **sin autenticación**, lo que exponía creación de contactos a cualquiera que conociera un UUID de cuenta.

## Decisión

1. **Secreto compartido** en servidor: variable `CAPTURE_API_SECRET`. Sin ella el endpoint responde **503** (captura deshabilitada).
2. **Autenticación:** comparación en tiempo constante con `Authorization: Bearer <secret>` o cabecera `X-Capture-Secret` (para integraciones que no manejan Bearer).
3. **Tenant:** preferir **`accountSlug`** en el JSON; se mantiene **`accountId`** como alternativa legacy para scripts internos.
4. **Validación:** al menos **email o teléfono**; `channel` limitado a `web_widget`, `landing`, `whatsapp`, `form` (por defecto `form`).
5. **Auditoría:** evento `lead_captured`, `actorType: integration`, sin bloquear la respuesta si falla el insert de auditoría.

## Ampliación (formulario `/lead`)

- Página pública **`/lead`** con server action que llama al mismo núcleo (`createLeadCapture`) sin exponer el secreto HTTP.
- Activación explícita: `ENABLE_PUBLIC_LEAD_FORM=true`; honeypot anti-bots básico.

## Ampliación (Sprint S01)

- **Validación de campos** centralizada en `apps/web/src/lib/capture-validation.ts`: email (regex MVP), teléfono (7–15 dígitos), longitudes máx. nombre/mensaje.
- **Rate limiting por IP en memoria** (`rate-limit-memory.ts`): claves `capture-api:*` y `capture-form:*`; configurable con `CAPTURE_RATE_LIMIT_MAX` y `CAPTURE_RATE_LIMIT_WINDOW_SEC`. Freno suave en serverless (no global entre instancias); límite estricto con KV/Edge en el futuro.
- **API:** JSON inválido → 400; exceso de tasa → 429 + `Retry-After`.

## No incluido (post-S01)

- Claves por cuenta en BD, rotación de secretos.
- Widget o script embebible (Sprint S02+; hasta entonces solo API + doc de proxy).

## Referencias

- `apps/web/src/lib/capture-validation.ts`, `apps/web/src/lib/rate-limit-memory.ts`, `apps/web/src/lib/client-ip.ts`
- `apps/web/src/app/api/contacts/create/route.ts`
- `apps/web/src/domains/capture/services/create-lead-capture.ts`
- `apps/web/src/app/lead/*`
- `docs/capture-integration.md`
- `docs/status-mvp.md`, `docs/manual-actions-required.md`
