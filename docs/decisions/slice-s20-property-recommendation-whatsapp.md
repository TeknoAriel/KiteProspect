# Slice S20 — Envío de recomendación por WhatsApp (F1-E14)

## Contexto

`docs/mvp-phase1-status.md` marcaba pendiente el **envío de recomendaciones por canal** pese al matching v0 (S04–S05). El modelo ya incluye `Recommendation` y `PropertyMatch.sentAt`.

## Decisión

- Desde la **ficha de contacto**, cada fila de `PropertyMatch` puede enviarse por **WhatsApp** con acción de servidor (mismo rol que envío manual existente: **admin / coordinator**).
- Flujo: texto estructurado (título, zona, precio, motivo del match, nombre de cuenta) → `sendWhatsAppTextToContact` → transacción `Recommendation` (`channel: whatsapp`) + `PropertyMatch.sentAt` actualizado.
- Auditoría: `property_recommendation_sent_whatsapp` sobre entidad `recommendation`.
- Sin envío si la propiedad no está `available` (coherencia con inventario real).
- Reenvíos: permitidos; cada envío crea un `Recommendation` nuevo; `sentAt` refleja el último envío.

## Pendiente (Fase 2+)

- Otros canales (email, widget) reutilizando `Recommendation.channel`.
- Plantillas editables por cuenta; métricas delivered/opened.

## Referencias

- `apps/web/src/domains/matching/services/send-property-recommendation-whatsapp.ts`
- `apps/web/src/app/dashboard/contacts/[id]/recommendation-actions.ts`
- `apps/web/src/app/dashboard/contacts/[id]/send-recommendation-whatsapp-button.tsx`
