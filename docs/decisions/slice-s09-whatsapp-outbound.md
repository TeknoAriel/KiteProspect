# Decisión: WhatsApp envío saliente y cumplimiento (F1-E15 / Sprint S09)

## Implementado

1. **Servicio** `sendWhatsAppTextToContact` (`apps/web/src/domains/integrations/whatsapp/send-whatsapp-text.ts`)
   - `POST` a Graph API: `https://graph.facebook.com/{WHATSAPP_GRAPH_VERSION|v21.0}/{WHATSAPP_PHONE_NUMBER_ID}/messages`.
   - Texto no vacío, máximo 4096 caracteres.
   - **Opt-out:** si `getWhatsAppSendBlockReason` indica bloqueo (último `Consent` canal `whatsapp` con `granted: false`), no envía.
   - Crea o reutiliza `Conversation` activa `whatsapp`; persiste `Message` outbound (`sent` o `failed`) con `metadata.waMessageId` si aplica.
   - Auditoría: `whatsapp_outbound_sent` / `whatsapp_outbound_failed`.

2. **Consentimiento** `getWhatsAppSendBlockReason` (`whatsapp-consent.ts`).

3. **API** `POST /api/whatsapp/send`
   - Sesión requerida; **`admin`** o **`coordinator`** (alineado con asistencia IA en inbox, S12).
   - Cuerpo JSON: `{ "contactId": "…", "text": "…" }`.
   - Respuestas: `200` éxito; `401` sin sesión; `403` rol u opt-out; `400` validación / Graph / config.

## No incluido (post-MVP o siguiente trabajo)

- Envío desde ficha contacto (opcional); el hilo de inbox con borrador IA cubre el flujo principal (S12).
- Plantillas (template messages) y ventana de 24 h / políticas Meta detalladas.
- Envío automático desde jobs de follow-up (requiere alinear con S07).

## Variables de entorno

| Variable | Uso |
|----------|-----|
| `WHATSAPP_PHONE_NUMBER_ID` | ID del número en Graph (obligatorio para enviar). |
| `WHATSAPP_ACCESS_TOKEN` | Token de la app (obligatorio para enviar). |
| `WHATSAPP_GRAPH_VERSION` | Opcional; por defecto `v21.0`. |

Siguen aplicando las de S08: `WHATSAPP_ACCOUNT_SLUG`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET` (webhook).

Ver `.env.example` y `docs/manual-actions-required.md`.

## Referencias

- `apps/web/src/app/api/whatsapp/send/route.ts`
- `apps/web/src/domains/integrations/whatsapp/send-whatsapp-text.ts`
- `docs/decisions/slice-s08-whatsapp-webhook.md`
