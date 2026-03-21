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

## No incluido (MVP)

- Rate limiting, claves por cuenta en BD, rotación de secretos.
- Widget o script embebido (solo API + doc de proxy).

## Referencias

- `apps/web/src/app/api/contacts/create/route.ts`
- `apps/web/src/domains/capture/services/create-lead-capture.ts`
- `apps/web/src/app/lead/*`
- `docs/capture-integration.md`
- `docs/status-mvp.md`, `docs/manual-actions-required.md`
