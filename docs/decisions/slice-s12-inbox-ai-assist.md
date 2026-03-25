# Decisión: inbox con hilo, asistencia IA y envío manual del borrador (F1-E8 / F1-E9 / Sprint S12)

## Implementado

1. **Ruta** `/dashboard/inbox/[conversationId]`: últimos 200 mensajes, enlace a ficha contacto.
2. **Lista inbox** (`/dashboard/inbox`): la tarjeta abre el hilo; enlace lateral “Ficha contacto”.
3. **Panel cliente** `ConversationAiPanel`: “Sugerir respuesta (IA)” → `POST /api/ai/conversation/next-action`; muestra `kind`, versión de prompt, reglas S11 si aplican; si `reply`, textarea editable.
4. **WhatsApp**: si el canal de la conversación es `whatsapp`, botón “Enviar por WhatsApp” → `POST /api/whatsapp/send` (mismo flujo que S09). **Humano en el loop** (no envío automático al recibir mensaje).
5. **Roles**: IA y envío WA para **admin** y **coordinator**; asesores ven mensaje informativo.
6. **Overrides por cuenta** en `Account.config` (JSON, sin migración):
   - `aiConversationPromptVersion` — prioridad sobre `AI_CONVERSATION_PROMPT_VERSION` y default.
   - `aiConversationSystemPromptAppend` — texto añadido al system prompt global.
7. **API** `GET` / `PATCH /api/account/ai-prompt-config` (solo **admin**); auditoría `account_ai_prompt_config_updated`.
8. **UI** `/dashboard/account/ai-prompt` (admin) + enlace “IA (cuenta)” en el dashboard.
9. **`planNextConversationAction`**: carga `Account.config` y construye prompt con `resolveConversationPromptVersion` + `buildConversationSystemPrompt`.

## Prioridad de versión de prompt

1. `Account.config.aiConversationPromptVersion`
2. `AI_CONVERSATION_PROMPT_VERSION` (env)
3. Default `s11-v1`

## No incluido (backlog)

- Envío automático del borrador sin confirmación humana.
- Plantillas Meta / ventana 24 h documentadas en producto.
- Editor de prompt completo en UI (solo append + etiqueta de versión).

## Referencias

- `apps/web/src/app/dashboard/inbox/[conversationId]/`
- `apps/web/src/domains/auth-tenancy/account-ai-prompt-config.ts`
- `apps/web/src/domains/ai-orchestration/prompt-config.ts`
- `apps/web/src/app/api/account/ai-prompt-config/route.ts`
