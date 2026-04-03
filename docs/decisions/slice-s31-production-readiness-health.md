# S31 — Salud de despliegue (`/api/health`)

**Contexto:** Fase 1 MVP está implementada en código; el cierre operativo en producción depende de variables y secretos en el hosting.

**Decisión:** Extender `GET /api/health` (público, sin secretos) con:

1. **`authUrlConfigured`** y, en entorno desplegado (`VERCEL=1` o `NODE_ENV=production`), **`issues`** incluye `auth_url_falta_produccion` si falta `AUTH_URL` — alineado a `docs/produccion-checklist-usuario.md`.
2. **`integrations`:** solo booleanos (`captureApi`, `cron`, `followUpEmailResend`, `whatsappWebhook`, `whatsappOutbound`, `aiConversational`) más `aiProviderExpected` (`gemini` | `openai`) para diagnóstico rápido sin exponer valores.
3. **`deploy.commit`:** si existe `VERCEL_GIT_COMMIT_SHA`, se devuelve para correlacionar con el deployment.

**Fuera de alcance:** no comprobar conectividad a Meta, Resend ni OpenAI/Gemini (evita latencia y dependencia de redes externas en cada health check).

**Referencias:** `docs/manual-actions-required.md`, `docs/produccion-checklist-usuario.md`.
