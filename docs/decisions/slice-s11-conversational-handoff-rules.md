# Decisión: motor conversacional — reglas de handoff + trazabilidad + versionado de prompt (F1-E9 / Sprint S11)

## Implementado

1. **`prompt-config.ts`**: `getConversationPromptVersion()` (default `s11-v1`, override `AI_CONVERSATION_PROMPT_VERSION`) y `getConversationSystemPrompt()` con línea de versión y refuerzo de handoff (humano explícito / tema legal).
2. **`handoff-rules.ts`**: `applyHandoffRules()` ejecutado **después** del modelo; solo puede pasar de `reply`/`noop` a `handoff`:
   - `commercial_stage_blocked` si `commercialStage === "blocked"`.
   - `whatsapp_opt_out` si canal `whatsapp` y hay bloqueo por consentimiento (`getWhatsAppSendBlockReason`).
   - `sensitive_or_legal_keywords` (regex sobre último mensaje inbound).
   - `explicit_human_request` (regex pedido de humano).
3. **`planNextConversationAction`**: usa el system prompt anterior; auditoría `ai_next_action_planned` con `modelSuggestedKind`, `finalKind`, `appliedRuleIds`; si aplica reglas y queda `handoff`, segundo evento `ai_handoff_rules_applied`.
4. **API** `POST /api/ai/conversation/next-action` y **health** `GET /api/health/ai`: respuesta incluye `modelSuggestedKind` y `appliedRuleIds` cuando aplica.

## Variables de entorno

| Variable | Obligatorio | Descripción |
|----------|-------------|-------------|
| `AI_CONVERSATION_PROMPT_VERSION` | No | Etiqueta de versión del prompt (auditoría / trazabilidad). Default `s11-v1`. |

Resto del proveedor: ver `slice-s10-conversational-ai.md` y `.env.example`.

## No incluido (backlog)

- Versionado de prompts en BD o UI editable por tenant.
- Envío automático del `draftReply` al canal.

## Referencias

- `apps/web/src/domains/ai-orchestration/handoff-rules.ts`
- `apps/web/src/domains/ai-orchestration/prompt-config.ts`
- `apps/web/src/domains/ai-orchestration/plan-next-conversation-action.ts`
