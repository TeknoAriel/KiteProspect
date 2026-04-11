# L20 — F3-E5+ SMS segundo proveedor (Telnyx)

**Fecha:** 2026-04-07  
**Contexto:** `docs/roadmap.md` F3-E5 “más canales”; L16 añadió SMS con **Twilio**. Algunos tenants prefieren otro proveedor sin duplicar lógica de consentimiento ni cron.

## Decisión

1. **Variable `SMS_PROVIDER`:** `twilio` (defecto) o `telnyx`. Determina qué credenciales deben estar presentes para que el envío automático funcione.
2. **Telnyx:** API v2 `POST https://api.telnyx.com/v2/messages`, `Authorization: Bearer TELNYX_API_KEY`, cuerpo JSON `{ from, to, text }`. ID de mensaje en `data.id`.
3. **Twilio:** sin cambios de contrato; código extraído a `twilio-sms-send.ts`.
4. **Consentimiento y teléfono:** compartidos (`sms-consent`, `normalizePhoneE164ForSms`).
5. **Health (`/api/health`):** `followUpSmsProvider`, `followUpSmsConfigured` (según proveedor elegido), `followUpSmsTelnyx` (presencia de vars Telnyx), se mantiene `followUpSmsTwilio`.
6. **Fuera de alcance:** webhooks DLR Telnyx, segundo número por tenant, plantillas.

## Referencias

- `apps/web/src/domains/integrations/sms/send-follow-up-sms.ts`
- `docs/decisions/slice-l16-f3e5-sms-twilio-follow-up.md`
