# Seguimiento: email (Resend) + canales manuales (Instagram, etc.)

**Fecha:** 2026-03-30  
**Contexto:** cerrar la brecha entre planes JSON documentados (`follow-up-plans-real-estate-templates.md`) y ejecución real del cron (`processDueFollowUps`).

## Decisión

1. **`channel: "email"`** — Envío transaccional vía **Resend HTTP API** (`fetch`, sin dependencia npm) cuando existen `RESEND_API_KEY` y `FOLLOW_UP_FROM_EMAIL`. Asunto: `FOLLOW_UP_EMAIL_SUBJECT_PREFIX` + nombre de cuenta. Cuerpo: `objective` o texto por defecto. Opt-out vía `Consent` canal `email` (mismo patrón que WhatsApp).

2. **Sin Resend** o **sin email en el contacto** — Se registra el intento con `outcome: manual` y se crea una **`Task`** (`type: followup`) en el contacto para que el equipo envíe el correo u otro canal.

3. **`channel: "instagram"`**, **`ig`** u otros — Sin API de DM en MVP: **`Task`** en ficha + `outcome: manual` en `FollowUpAttempt`, metadata con nota operativa.

4. **`whatsapp`** — Sin cambio de comportamiento (Meta Graph).

## Variables de entorno

| Variable | Uso |
|----------|-----|
| `RESEND_API_KEY` | Bearer en `POST https://api.resend.com/emails` |
| `FOLLOW_UP_FROM_EMAIL` | Remitente verificado en Resend |
| `FOLLOW_UP_EMAIL_SUBJECT_PREFIX` | Opcional; default `Seguimiento` |

## Pendiente (Fase 2+)

- Envío email con plantillas HTML por tenant.
- Instagram Graph API para DM automatizado (políticas Meta + consentimiento).
- Un solo paso con varios canales en paralelo sin duplicar filas JSON.
