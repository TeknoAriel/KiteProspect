# Configuración manual paso a paso (lo que la IA no puede hacer por ti)

Este documento lista **acciones solo humanas**: cuentas externas, secretos y clics en consolas web. Incluye **URL**, **dónde pegar cada valor** y **ejemplos** alineados a Kite Prospect.

**Norma:** los nombres exactos de variables están en **`.env.example`** (raíz del repo) y en **`docs/manual-actions-required.md`**.

---

## 1. Base de datos PostgreSQL (Neon u otro)

| Qué | Dónde |
|-----|--------|
| **URL del panel** | [https://console.neon.tech](https://console.neon.tech) (si usas Neon) |
| **Alternativas** | [Supabase](https://supabase.com), [Railway](https://railway.app), PostgreSQL local |

**Pasos (Neon):**

1. Entrá en [console.neon.tech](https://console.neon.tech) e iniciá sesión (GitHub/Google).
2. **Create project** → elegí región cercana → creá el proyecto.
3. En el proyecto: **Dashboard** → sección **Connection details** (o **Connect**).
4. Copiá la **connection string** (formato `postgresql://usuario:contraseña@host/neondb?sslmode=require`).
5. En tu PC, en la **raíz** del repo, archivo **`.env`**:
   - Variable: `DATABASE_URL`
   - Valor: la cadena completa que te dio Neon (entre comillas si tiene caracteres especiales).

**En Vercel (producción):** [ver sección 3](#3-vercel-variables-de-entorno-y-deploy) → misma variable `DATABASE_URL` en **Settings → Environment Variables**.

---

## 2. Secreto de NextAuth (`AUTH_SECRET`)

| Variable | `AUTH_SECRET` |
|----------|----------------|
| **Para qué** | Firmar sesiones (NextAuth / Auth.js). |

**Generar un valor (ejemplo en terminal):**

```bash
openssl rand -base64 32
```

**Dónde ponerlo:**

- **Local:** `.env` en la raíz del monorepo:
  ```env
  AUTH_SECRET="pega-aqui-el-resultado-de-openssl"
  ```
- **Vercel:** Settings → Environment Variables → nombre `AUTH_SECRET`, valor el mismo string → entornos *Production* (y *Preview* si querés).

**URL Vercel:** [https://vercel.com](https://vercel.com) → tu proyecto → **Settings** → **Environment Variables**.

---

## 3. Vercel: variables de entorno y deploy

| URL | [https://vercel.com](https://vercel.com) |
|-----|------------------------------------------|

**Pasos:**

1. Iniciá sesión en Vercel y abrí el proyecto vinculado a este repo (o importá el repo desde **Add New → Project**).
2. **Settings** → **Environment Variables**.
3. Agregá **una fila por variable** (nombre exacto como en `.env.example`). Para cada una:
   - **Name:** por ejemplo `DATABASE_URL`, `AUTH_SECRET`, `OPENAI_API_KEY`, etc.
   - **Value:** el secreto o cadena (sin compartir en chats públicos).
   - **Environment:** marcá al menos **Production**; opcional **Preview** / **Development** para previews.
4. **Deployments:** después de cambiar variables, hacé **Redeploy** del último deployment (o un push nuevo a la rama conectada) para que tome los valores.

**URL del sitio:** en el dashboard del proyecto, **Domains** — ahí ves `tu-proyecto.vercel.app` o dominio custom. Esa base URL sirve para:

- App: `https://TU-DOMINIO/`
- Webhook WhatsApp: `https://TU-DOMINIO/api/webhooks/whatsapp`

**Opcional — URL pública para Auth:**

```env
AUTH_URL="https://TU-DOMINIO"
```

En **Settings → Environment Variables** en Vercel, si el login en producción falla por URL, agregá `AUTH_URL` con tu URL canónica (con `https://`).

---

## 4. IA conversacional S10 (Gemini u OpenAI)

| Proveedor | URL |
|----------|-----|
| Gemini (Google) | [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) |
| OpenAI | [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys) |

**Pasos:**

1. Definí proveedor en `.env` y Vercel:
   ```env
   AI_PROVIDER="gemini"
   ```
2. Si usás **Gemini** (recomendado):
   - Creá/entrá con cuenta laboral en [aistudio.google.com](https://aistudio.google.com/).
   - Generá key en [API keys](https://aistudio.google.com/app/apikey).
   - Cargá:
     ```env
     GEMINI_API_KEY="AIza...tu-clave..."
     GEMINI_MODEL="gemini-2.5-flash-lite"
     ```
3. Si usás **OpenAI**:
   - Generá key en [platform.openai.com/api-keys](https://platform.openai.com/api-keys).
   - Cargá:
     ```env
     OPENAI_API_KEY="sk-...tu-clave..."
     OPENAI_MODEL="gpt-4o-mini"
     ```
4. En **Vercel** → **Settings → Environment Variables:** mismas variables para **Production**.
5. **Opcional (S11 — trazabilidad del prompt):** `AI_CONVERSATION_PROMPT_VERSION` (ej. `s11-v1` o un tag interno al desplegar cambios de copy). Ver `docs/decisions/slice-s11-conversational-handoff-rules.md`.
6. **Overrides por tenant (S12):** en la app, usuario **admin** → **IA (cuenta)** (`/dashboard/account/ai-prompt`): versión y texto adicional persistidos en `Account.config` (sin tocar Vercel).

**Probar (con sesión):** desde **Inbox** → abrir un hilo → **Sugerir respuesta (IA)**; o `POST /api/ai/conversation/next-action` con `{ "conversationId": "<id>" }` (**admin** o **coordinator**). El id está en la tabla `Conversation` o en el seed demo.

---

## 5. WhatsApp Cloud API (Meta) — webhook + envío

Documentación de producto: **`docs/decisions/slice-s08-whatsapp-webhook.md`** y **`slice-s09-whatsapp-outbound.md`**.

| Recurso | URL |
|---------|-----|
| Meta for Developers | [https://developers.facebook.com](https://developers.facebook.com) |
| Apps | [https://developers.facebook.com/apps](https://developers.facebook.com/apps) |
| Documentación WhatsApp Cloud API | En el portal de Meta: producto **WhatsApp** → guías oficiales |

**A alto nivel (valores concretos dependen de tu app Meta):**

1. Creá o abrí una **app** en [developers.facebook.com/apps](https://developers.facebook.com/apps).
2. Agregá el producto **WhatsApp**.
3. En el panel de WhatsApp obtené:
   - **Phone number ID** → variable **`WHATSAPP_PHONE_NUMBER_ID`**
   - **Temporary / System User access token** (o token de larga duración según tu flujo) → **`WHATSAPP_ACCESS_TOKEN`**
4. Para el **webhook**:
   - **Verify token** (string que inventás vos, ej. `mi-token-secreto-webhook-2025`) → **`WHATSAPP_VERIFY_TOKEN`** (mismo valor en Meta y en `.env`).
   - **App Secret** (en **App settings → Basic**) → **`WHATSAPP_APP_SECRET`** (para validar firma `X-Hub-Signature-256` en POST).
5. **Callback URL** en Meta: `https://TU-DOMINIO/api/webhooks/whatsapp` (sustituí `TU-DOMINIO` por tu dominio Vercel o custom).
6. Tenant MVP en código: **`WHATSAPP_ACCOUNT_SLUG`** = slug de la cuenta en Kite (ej. `demo` del seed).

**Dónde pegar:** `.env` local y **Vercel → Environment Variables** (mismos nombres).

---

## 6. Captura de leads — API pública (`CAPTURE_API_SECRET`)

| Para qué | Proteger `POST /api/contacts/create` |

1. Generá un secreto: `openssl rand -base64 32`.
2. **`.env`:** `CAPTURE_API_SECRET="..."`
3. **Vercel:** misma variable.
4. Las peticiones deben enviar el secreto en `Authorization: Bearer …` o cabecera `X-Capture-Secret`.

Detalle: `docs/decisions/slice-capture-api-hardening.md` y `docs/capture-integration.md`.

---

## 7. Cron de seguimientos (`CRON_SECRET`)

| Ruta | `GET /api/cron/follow-up-due` |
|------|-------------------------------|

1. Generá un secreto (mismo método que arriba).
2. **`CRON_SECRET`** en `.env` y en Vercel.
3. Llamadas manuales: cabecera `Authorization: Bearer <CRON_SECRET>`.

Ver: `docs/decisions/slice-s07-follow-up-cron.md`.

---

## Resumen rápido de variables por tema

| Tema | Variables típicas |
|------|-------------------|
| App + DB | `DATABASE_URL`, `AUTH_SECRET`, opcional `AUTH_URL` |
| IA (S10–S11) | `AI_PROVIDER`, `GEMINI_API_KEY` (+ opcional `GEMINI_MODEL`) o `OPENAI_API_KEY` (+ opcional `OPENAI_MODEL`); opcional `AI_CONVERSATION_PROMPT_VERSION` |
| WhatsApp | `WHATSAPP_ACCOUNT_SLUG`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, opcional `WHATSAPP_GRAPH_VERSION` |
| Captura | `CAPTURE_API_SECRET` |
| Cron | `CRON_SECRET` |

---

## Checklist antes de pedir ayuda

- [ ] `.env` en la **raíz** del monorepo (no solo dentro de `apps/web/`).
- [ ] Mismas variables críticas en **Vercel** si probás producción.
- [ ] Después de cambiar env en Vercel: **Redeploy**.

Para texto más narrado sin consola: **`docs/paso-a-paso-sin-programar.md`** y **`docs/paso-a-paso-vercel-kiteprospect.md`**.
