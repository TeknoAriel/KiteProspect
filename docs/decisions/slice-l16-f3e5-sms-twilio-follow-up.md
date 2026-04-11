# L16 / F3-E5 — SMS en seguimientos (Twilio)

**Fecha:** 2026-04-06  
**Estado:** implementado (MVP).

## Contexto

`docs/roadmap.md` F3-E5: más canales. Ya existían email (Resend), WhatsApp (Meta) e Instagram/manual en cron. Se añade **SMS** para pasos de plan con `"channel": "sms"`.

## Decisión

1. **Proveedor:** Twilio REST (`POST .../Messages.json`) con **Basic Auth** (`AccountSid:AuthToken`), sin SDK npm.

2. **Variables:** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` (E.164 del remitente verificado en Twilio).

3. **Consentimiento:** tabla `Consent` con `channel: "sms"` — si el último registro tiene `granted: false`, no se envía (mismo patrón que email/WhatsApp).

4. **Cron:** `processDueFollowUps` trata `sms` como email: envío automático si está configurado; si no, **tarea manual** con texto guía; sin teléfono válido → tarea manual.

5. **Cuerpo:** `objective` del paso o texto por defecto con nombre de cuenta (máx. 1600 caracteres).

6. **No** en este MVP: webhooks de estado Twilio, inbox unificado de SMS, plantillas por tenant.

**Actualización L20:** proveedor alternativo **Telnyx** vía `SMS_PROVIDER=telnyx` — ver `slice-l20-f3e5-sms-telnyx-provider.md`.

## Referencias

- `docs/decisions/slice-follow-up-channels-email-manual.md`
- `docs/manual-actions-required.md`
