# Decisión: motor conversacional MVP — orquestación + proveedor dual (Gemini/OpenAI) (F1-E9 / Sprint S10)

## Implementado

1. **Contrato** `NextConversationAction` (`reply` | `handoff` | `noop`) en `types.ts`.
2. **Servicio** `planNextConversationAction({ conversationId, accountId, actorUserId })`:
   - Carga conversación + contacto + últimos 30 mensajes.
   - Llama al proveedor configurado por entorno (`AI_PROVIDER=gemini|openai`) con salida JSON; system prompt y versión: `prompt-config.ts` + overrides por cuenta en `Account.config` (S12, `slice-s12-inbox-ai-assist.md`).
   - Parseo estricto en `parse-next-action.ts` (no ejecuta mutaciones sobre entidades).
3. **Proveedor** HTTP sin SDK:
   - `gemini-chat-json.ts` → Google Generative Language API.
   - `openai-chat-json.ts` → OpenAI Chat Completions API.
   - `provider-chat-json.ts` como router por variable `AI_PROVIDER`.
4. **API** `POST /api/ai/conversation/next-action` — sesión; roles **`admin`** o **`coordinator`**; body `{ "conversationId": "…" }`.
5. **Auditoría** `ai_next_action_planned` con `promptVersion`, `model`, `actionKind`.

## Variables de entorno

| Variable | Obligatorio | Descripción |
|----------|-------------|-------------|
| `AI_PROVIDER` | No | `gemini` (default) o `openai`. |
| `GEMINI_API_KEY` | Sí, si `AI_PROVIDER=gemini` | Clave de Google AI Studio. |
| `GEMINI_MODEL` | No | Por defecto `gemini-2.5-flash-lite` (liviano). Ver [modelos](https://ai.google.dev/gemini-api/docs/models/gemini). |
| `OPENAI_API_KEY` | Sí, si `AI_PROVIDER=openai` | Clave de API de OpenAI. |
| `OPENAI_MODEL` | No | Por defecto `gpt-4o-mini`. |

Ver `.env.example` y `docs/configuracion-manual-paso-a-paso.md` (sección OpenAI).

## Slices relacionados

- **S11:** reglas de handoff después del modelo, eventos de auditoría adicionales y versión de prompt (`slice-s11-conversational-handoff-rules.md`).

## No incluido (backlog)

- Envío automático del `draftReply` a WhatsApp / inbox.
- Versionado de prompts en BD o UI.

## Prueba local sin navegador

Desde la raíz del monorepo: `npm run test:ai` (carga `.env`; requiere clave del proveedor activo, p. ej. `GEMINI_API_KEY`).

## Verificación en producción (sin sesión)

`GET /api/health/ai` con cabecera `Authorization: Bearer <CRON_SECRET>` (mismo valor que `CRON_SECRET` en Vercel). Ejecuta una llamada real al proveedor sobre la conversación más reciente y devuelve `actionKind` si todo está OK.

## Referencias

- `apps/web/src/domains/ai-orchestration/`
- `apps/web/src/app/api/ai/conversation/next-action/route.ts`
- `apps/web/src/app/api/health/ai/route.ts`
- `apps/web/scripts/test-ai-next-action.ts`
