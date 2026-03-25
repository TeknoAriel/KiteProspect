# Decisión: motor conversacional — reglas de handoff + trazabilidad + versionado de prompt (F1-E9 / Sprint S11)

## Implementado

1. **`prompt-config.ts`**: versión y system prompt (línea de versión, handoff humano/legal). Resolución de versión: ver **S12** (`Account.config` → env → default `s11-v1`); funciones `resolveConversationPromptVersion` / `buildConversationSystemPrompt`.
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
| `AI_CONVERSATION_PROMPT_VERSION` | No | Etiqueta si no hay override en `Account.config`. Default `s11-v1`. |

Override por tenant: `Account.config` o UI admin — ver `slice-s12-inbox-ai-assist.md`. Resto del proveedor: `slice-s10` y `.env.example`.

## No incluido (backlog)

- Sustituir por completo el system prompt desde UI (solo append por cuenta en S12).
- Envío automático del `draftReply` sin confirmación (S12: envío manual desde inbox).

## Referencias

- `apps/web/src/domains/ai-orchestration/handoff-rules.ts`
- `apps/web/src/domains/ai-orchestration/prompt-config.ts`
- `apps/web/src/domains/ai-orchestration/plan-next-conversation-action.ts`
