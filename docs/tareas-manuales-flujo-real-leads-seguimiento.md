# Tareas manuales — flujo real: leads, conversaciones y seguimiento

**Objetivo:** dejar el entorno en un estado donde podés **ingresar leads**, **ver conversaciones en inbox**, **ejecutar seguimientos** (cron) y, si configurás canales, **WhatsApp / email / SMS reales**.

**Regla de URLs:** en todo este documento, **`TU_BASE`** es la URL pública **exacta** que ves en el navegador al abrir la app (sin barra final). Ejemplos: `https://tu-proyecto.vercel.app` o tu dominio propio. **No** fijes un hostname inventado: copiá la de **Vercel → tu proyecto → Deployments → abrir el deployment → Visit** (política del repo).

**Orden recomendado:** seguí las fases **0 → 1 → 2** como mínimo; luego **3–5** para operación; **6–8** según prioridad.

---

## Fase 0 — Obtener la base URL (`TU_BASE`)

| Paso | Qué hacés | URL / acción |
|------|-----------|--------------|
| 0.1 | Entrá a [vercel.com](https://vercel.com) → tu proyecto conectado a **TeknoAriel/KiteProspect** (`main`, Root **`apps/web`**) | — |
| 0.2 | **Deployments** → último **Ready** → **Visit** | Copiá la URL de la barra de direcciones → eso es **`TU_BASE`** |
| 0.3 | (Opcional local) Si probás en tu PC: `npm run dev` en la raíz del monorepo | **`TU_BASE` = `http://localhost:3000`** |

Guardá `TU_BASE` en un bloc de notas; lo vas a usar en todas las rutas siguientes.

---

## Fase 1 — Variables de entorno (Vercel Production o `.env` local)

### 1.1 Dónde cargarlas en la nube

**Vercel** → tu proyecto → **Settings** → **Environment Variables** → ambiente **Production** (y **Preview** si querés previews con la misma config).

Los **nombres** deben coincidir **exactamente** con la primera columna (mayúsculas y guiones bajos).

### 1.2 Tabla — qué pegar exactamente

| Variable | Obligatorio | Qué poner (exactitud) |
|----------|-------------|------------------------|
| `DATABASE_URL` | **Sí** | Cadena `postgresql://...` de tu Postgres (p. ej. [Neon](https://neon.tech) → **Connection string** → copiar completa). Debe ser la base **de ese entorno** (producción ≠ local). |
| `AUTH_SECRET` | **Sí** | Secreto largo aleatorio. Generar en terminal: `openssl rand -base64 32` (o equivalente). **Distinto** en producción vs tu PC. |
| `AUTH_URL` | **Sí en producción** | **`TU_BASE` sin barra final.** Ejemplo correcto: `https://tu-app.vercel.app` — **incorrecto:** `https://tu-app.vercel.app/` |
| `CAPTURE_API_SECRET` | **Sí** si usás `POST /api/contacts/create` o `/lead` con el patrón del servidor | Otro secreto (`openssl rand -base64 32`). Mismo valor en **Authorization: Bearer …** o cabecera `X-Capture-Secret`. **Alternativa:** dejar este vacío en Vercel y crear en panel una clave **`kp_…`** (ver fase 3). |
| `CRON_SECRET` | **Sí** para probar crons a mano y para coherencia con `/api/health` | Secreto (`openssl rand -base64 32`). Lo enviás como `Authorization: Bearer <CRON_SECRET>` al llamar los endpoints de cron. |
| `ENABLE_PUBLIC_LEAD_FORM` | Opcional | `true` si querés el formulario público en **`TU_BASE/lead`**. Si no está en `true`, esa ruta no sirve para prueba simple. |

**Después de guardar variables:** en Vercel hacé **Redeploy** del último deployment (o un push vacío) para que el runtime las tome en builds nuevos según política de Vercel.

**Build:** el proyecto usa `build:vercel` (migraciones + seed + build). No hace falta que corras migraciones en tu PC para que producción tenga tablas; sí necesitás `DATABASE_URL` correcta en Vercel. Detalle: `docs/decisions/vercel-build-migrations-seed.md`.

---

## Fase 2 — Comprobar salud y entrar al panel

| Paso | URL | Qué deberías ver |
|------|-----|------------------|
| 2.1 | **`TU_BASE/api/health`** | JSON con `ok`, estado de base de datos, flags de integración **sin secretos**. Si en producción falta `AUTH_URL` alineada, puede aparecer aviso en `issues`. |
| 2.2 | **`TU_BASE/login`** | Pantalla de login con **slug de cuenta**, email y contraseña. |

### Credenciales demo (solo si existe seed en esa base)

El deploy con seed crea típicamente la cuenta **`demo`**:

| Campo | Valor exacto |
|-------|----------------|
| Slug de cuenta | `demo` |
| Email (admin) | `admin@demo.local` |
| Contraseña | `demo123` |

Si en tu base **no** hay seed, estos usuarios no existen: tendrías que crearlos por el flujo que uses en tu organización o correr seed en un entorno controlado.

| Paso | URL |
|------|-----|
| 2.3 Panel | **`TU_BASE/dashboard`** |
| 2.4 Contactos | **`TU_BASE/dashboard/contacts`** |
| 2.5 Inbox | **`TU_BASE/dashboard/inbox`** |
| 2.6 Seguimientos | **`TU_BASE/dashboard/followups`** |
| 2.7 Cuenta (admin) | **`TU_BASE/dashboard/account`** |

---

## Fase 3 — Ingresar leads (elegí al menos una vía)

### A) Formulario público `/lead`

1. Variable **`ENABLE_PUBLIC_LEAD_FORM=true`** en Vercel (o `.env` local).
2. Abrí **`TU_BASE/lead?slug=demo`** (fija la cuenta demo).
3. Enviá el formulario; después revisá **`TU_BASE/dashboard/contacts`** e **`TU_BASE/dashboard/inbox`**.

### B) API `POST /api/contacts/create` (recomendado para integraciones)

- Misma autenticación que **`CAPTURE_API_SECRET`** global **o** Bearer con clave **`kp_…`** creada en **`TU_BASE/dashboard/account/capture-api-keys`**.
- Cuerpo JSON mínimo: incluir **`accountSlug`** (ej. `demo`) y email o teléfono válido.
- Ejemplo copy-paste (PowerShell): ver **`docs/produccion-checklist-usuario.md` §6**.

### C) Meta Lead Ads

- Webhook en Meta apuntando a **`TU_BASE/api/webhooks/meta-leads`**.
- Variables: `META_LEAD_WEBHOOK_VERIFY_TOKEN`, recomendado `META_LEAD_WEBHOOK_APP_SECRET`; alta de **pageId** en **`TU_BASE/dashboard/account/integrations`**.
- Detalle: `docs/manual-actions-required.md` §6b.

---

## Fase 4 — Conversaciones “reales” en producto

| Acción | URL |
|--------|-----|
| Lista de hilos | **`TU_BASE/dashboard/inbox`** |
| Abrir un hilo | **`TU_BASE/dashboard/inbox/<conversationId>`** (desde la lista) |
| Ficha contacto | **`TU_BASE/dashboard/contacts/<id>`** |

**IA en respuestas (motor conversacional):** sin clave de proveedor, el comportamiento conversacional puede estar limitado según implementación. Para uso real de IA:

| Variable | Qué poner |
|----------|-----------|
| `GEMINI_API_KEY` | Clave de [Google AI Studio](https://aistudio.google.com/) / Gemini (formato `AIza...`). Opcional: `GEMINI_MODEL`. |
| **o** `OPENAI_API_KEY` | Clave `sk-...` de [OpenAI](https://platform.openai.com/api-keys). Opcional: `OPENAI_MODEL`. |

Convención dual: ver `.env.example` y `docs/manual-actions-required.md` §6 (proveedor IA).

---

## Fase 5 — Seguimiento automático (cron)

Los crons definidos en `apps/web/vercel.json` (en el proyecto con Root `apps/web`):

| Ruta programada | Horario (UTC) | Para qué |
|-----------------|---------------|----------|
| `/api/cron/follow-up-due` | `0 13 * * *` (diario ~13:00 UTC) | Procesa seguimientos vencidos |
| `/api/cron/kiteprop-property-feed` | `0 2 */2 * *` | Feed de propiedades (si lo usás) |

**Prueba manual inmediata (sin esperar el reloj):**

```http
GET TU_BASE/api/cron/follow-up-due
Authorization: Bearer <CRON_SECRET>
```

(En PowerShell usá `Invoke-WebRequest` o `curl` con la cabecera.)

**Requisito:** `CRON_SECRET` definido en el entorno. En Vercel, los crons oficiales usan cabecera `x-vercel-cron: 1`; para tu prueba manual usá Bearer como arriba.

**Planes de seguimiento (JSON):** admin → **`TU_BASE/dashboard/account/follow-up-plans`** (o enlaces desde **`TU_BASE/dashboard/account`**).

---

## Fase 6 — WhatsApp real (Meta Cloud API)

**No** es solo URL interna: tenés que crear app y número en **Meta for Developers**.

| Variable | Qué poner |
|----------|-----------|
| `WHATSAPP_ACCOUNT_SLUG` | Slug del tenant que recibe el webhook, ej. `demo` |
| `WHATSAPP_VERIFY_TOKEN` | Token que **vos elegís** y repetís en la consola de Meta al configurar el webhook |
| `WHATSAPP_APP_SECRET` | **App Secret** de la app Meta (validación de firma) — recomendado |
| `WHATSAPP_PHONE_NUMBER_ID` | ID del número en Graph API |
| `WHATSAPP_ACCESS_TOKEN` | Token de acceso de la app |
| `WHATSAPP_GRAPH_VERSION` | Opcional, ej. `v21.0` |

**URL del webhook (callback) en Meta — exactamente:**

```text
TU_BASE/api/webhooks/whatsapp
```

Ejemplo: si `TU_BASE` es `https://abc.vercel.app`, el callback es **`https://abc.vercel.app/api/webhooks/whatsapp`**.

Documentación técnica: `docs/decisions/slice-s08-whatsapp-webhook.md`, `docs/decisions/slice-s09-whatsapp-outbound.md`.

---

## Fase 7 — Email y SMS de seguimiento (opcional)

| Canal | Variables (nombres exactos) | Dónde obtener |
|-------|----------------------------|---------------|
| Email (Resend) | `RESEND_API_KEY`, `FOLLOW_UP_FROM_EMAIL` | [resend.com](https://resend.com) — dominio/remitente verificados |
| SMS Twilio | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` | [twilio.com](https://www.twilio.com) |
| SMS Telnyx | `SMS_PROVIDER=telnyx`, `TELNYX_API_KEY`, `TELNYX_FROM_NUMBER` | [Telnyx](https://telnyx.com) |

Si faltan, los planes suelen degradar a **tarea manual** en ficha en lugar de enviar el mensaje.

---

## Fase 8 — Inventario, integraciones avanzadas y CRM

| Qué | Dónde en la app | Notas |
|-----|-----------------|-------|
| Feeds de propiedades | **`TU_BASE/dashboard/account/property-feeds`** | URLs HTTPS del JSON/XML; no van en `.env` |
| Webhooks **salientes** (eventos Kite → tu URL) | **`TU_BASE/dashboard/account/webhooks`** | HTTPS; guardás el secreto de firma una vez |
| API keys captura `kp_…` | **`TU_BASE/dashboard/account/capture-api-keys`** | |
| Diagnóstico duplicados `externalId` | **`TU_BASE/dashboard/account/diagnostics/crm-external`** | Admin |
| Sync por lotes CRM → Kite | `POST TU_BASE/api/contacts/crm-batch-sync` | Ver `docs/capture-integration.md` §6 y OpenAPI |

---

## Checklist resumido (orden sugerido)

1. [ ] Anotar **`TU_BASE`** desde Vercel → Visit.
2. [ ] En Vercel: `DATABASE_URL`, `AUTH_SECRET`, **`AUTH_URL` = `TU_BASE` sin `/`**, `CRON_SECRET`, `CAPTURE_API_SECRET` (o planificar clave `kp_…` en panel).
3. [ ] Redeploy tras variables.
4. [ ] Abrir **`TU_BASE/api/health`** → verificar `ok` y BD.
5. [ ] Login en **`TU_BASE/login`** (demo si aplica).
6. [ ] Ingresar lead: **`TU_BASE/lead?slug=demo`** (con `ENABLE_PUBLIC_LEAD_FORM=true`) **o** POST create **o** Meta.
7. [ ] Ver **`TU_BASE/dashboard/contacts`** e **`TU_BASE/dashboard/inbox`**.
8. [ ] (Opcional) `GEMINI_API_KEY` u `OPENAI_API_KEY` para conversación asistida.
9. [ ] Probar cron manual: **`GET TU_BASE/api/cron/follow-up-due`** con `Authorization: Bearer <CRON_SECRET>`.
10. [ ] (Opcional) Configurar Meta → webhook WhatsApp a **`TU_BASE/api/webhooks/whatsapp`** + variables `WHATSAPP_*`.
11. [ ] (Opcional) Resend / Twilio / Telnyx según canales de seguimiento.

---

## Referencias cruzadas

| Documento | Contenido |
|-----------|-----------|
| `docs/manual-actions-required.md` | Lista amplia de acciones manuales y enlaces |
| `docs/produccion-checklist-usuario.md` | Rutas, health, ejemplo PowerShell captura |
| `docs/deploy-automation-one-time-setup.md` | GitHub + Vercel + Root `apps/web` |
| `docs/capture-integration.md` | Contrato API captura y CRM externo |
| `.env.example` | Nombres de todas las variables |
