# Demo por canal (simulación conversacional)

## Contexto

Evaluar el flujo conversacional (mensajes + IA + reglas) sin depender de Meta, Resend o Twilio en cada prueba.

## Decisión

- Ruta **`/dashboard/demo-channels`** (admin y coordinador).
- Por cada canal soportado se mantiene **una conversación demo** por cuenta: `channel` igual al de producción, `channelId` fijo `kite_demo_sim_v1` para no colisionar con webhooks o capturas reales.
- Contactos sintéticos con teléfonos `+1555…` y emails `demo-sim-*@kite.local` (solo demo).
- **Entrantes:** `POST /api/demo/sim/inbound` crea contacto/conversación si hace falta y persiste `Message` inbound.
- **Salientes de prueba:** `POST /api/demo/sim/outbound` persiste `Message` outbound sin enviar a proveedores externos.
- La IA reutiliza `POST /api/ai/conversation/next-action` como en el inbox.
- Auditoría: `demo_sim_inbound`, `demo_sim_outbound`.

## Canales en UI

`whatsapp`, `email`, `sms`, `web_widget`, `form`, `landing`, `meta_lead`.

## Pendiente / no objetivo

- No sustituye pruebas E2E con proveedores reales.
- Webhooks Twilio/Meta entrantes siguen siendo flujos aparte.
