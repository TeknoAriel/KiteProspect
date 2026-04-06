# Acciones manuales requeridas

Este archivo lista **solo** lo que debe hacer una persona (no el código) cuando sea necesario: credenciales externas, altas manuales o decisiones de negocio que no se pueden inferir.

**Norma de trabajo del proyecto** (rol, límites, cómo documentar implementado / pendiente / bloqueado): [working-rules.md](./working-rules.md).

**Configuración externa paso a paso (URLs, qué pegar en cada sitio):** [configuracion-manual-paso-a-paso.md](./configuracion-manual-paso-a-paso.md).

**Misma guía en lenguaje muy simple (pasos 1–7, sin tecnicismos):** [configuracion-paso-a-paso-humano.md](./configuracion-paso-a-paso-humano.md).

**Solo pruebas en producción (URL pública):** checklist con rutas y ejemplos → **[produccion-checklist-usuario.md](./produccion-checklist-usuario.md)**. Diagnóstico rápido sin secretos: **`https://TU-DOMINIO/api/health`** (ver §0 de esa guía y `docs/decisions/slice-s31-production-readiness-health.md`).

**Vercel (demo) — paso a paso:** usa la URL que muestre **tu** proyecto (**Deployments → Visit**). Guía con placeholder `https://TU-DEPLOYMENT.vercel.app`: **[paso-a-paso-vercel-kiteprospect.md](./paso-a-paso-vercel-kiteprospect.md)**. Si ves **404**, ver **[vercel-404-diagnostico.md](./decisions/vercel-404-diagnostico.md)**.

**Sin saber programar — guía larga con todas las URLs y textos a copiar:** **[paso-a-paso-sin-programar.md](./paso-a-paso-sin-programar.md)**.

**Git + Neon + Vercel — URLs oficiales y configuraciones precisas:** **[accesos-y-configuracion-git-neon-vercel.md](./accesos-y-configuracion-git-neon-vercel.md)**.

**Flujo completo pantalla a pantalla (alineación + CI sin secretos):** **[flujo-completo-pantalla-a-pantalla.md](./flujo-completo-pantalla-a-pantalla.md)**.

**Deploy automático (configuración única en Vercel + GitHub; después solo `git push`):** **[deploy-automation-one-time-setup.md](./deploy-automation-one-time-setup.md)**.

**Vercel muestra commits viejos pero GitHub `main` está al día:** la integración o el repo conectado en Vercel no coincide con el remoto del equipo → **[vercel-deploy-lag-behind-github.md](./decisions/vercel-deploy-lag-behind-github.md)** (reconectar repo, rama `main`, Root `apps/web`, redeploy o push vacío).

**Git — Tekno (origen + Vercel):** [github.com/TeknoAriel/KiteProspect](https://github.com/TeknoAriel/KiteProspect) → remoto **`origin`**. **Org (auditoría):** `git@github.com:kiteprop/ia-kiteprospects.git` → **`kiteprop`**, `npm run git:push:kiteprop` → **[git-dual-remote-tekno-kiteprop.md](./decisions/git-dual-remote-tekno-kiteprop.md)**. **Vercel:** conectar el proyecto al repo **TeknoAriel/KiteProspect**, rama `main`, root `apps/web` → **[deploy-automation-one-time-setup.md](./deploy-automation-one-time-setup.md)**.

**Sos colaborador y no podés tocar Vercel:** **[deploy-vercel-collaborator-without-owner.md](./deploy-vercel-collaborator-without-owner.md)** (deploy hook + workflow opcional, o pedir al owner que reconecte el repo).

---

## Ahora (desarrollo local)

### 1. Tener PostgreSQL disponible

**Qué hacer:** Instalar PostgreSQL en tu PC o crear una base en un servicio en la nube (Neon, Supabase, Railway, etc.).

**Pasos simples (ejemplo con servicio en la nube):**

1. Entra en el sitio del proveedor que elijas (por ejemplo [https://neon.tech](https://neon.tech) o [https://supabase.com](https://supabase.com)).
2. Crea un proyecto nuevo.
3. Copia la **connection string** que te dan (formato `postgresql://...`).
4. Pégala en tu archivo `.env` como `DATABASE_URL=...` (ver `docs/setup-local.md`).

**Por qué:** Sin base de datos no se pueden ejecutar migraciones ni Prisma contra datos reales.

---

### 2. Crear el archivo `.env`

**Qué hacer:** Copiar `.env.example` a `.env` y completar al menos `DATABASE_URL`.

**Pasos:**

1. En la **raíz** del monorepo: copia `.env.example` y renómbralo a `.env`.
2. Abre `.env` y reemplaza el valor de `DATABASE_URL` con tu cadena real.
3. Agrega `AUTH_SECRET` (requerido por NextAuth):

   ```env
   AUTH_SECRET="tu-secreto-aqui-genera-con-openssl-rand-base64-32"
   ```

   **Generar secreto:** En terminal: `openssl rand -base64 32` (o equivalente en tu OS).

4. **Login:** en `/login` indica el **slug de la cuenta** (demo: `demo`), el email y la contraseña. Sin slug correcto no se resuelve el tenant.

5. **Captura vía API:** define `CAPTURE_API_SECRET` en `.env` (mismo patrón que `AUTH_SECRET`) **o** genera en la cuenta una **API key de captura** (`/dashboard/account/capture-api-keys`, formato `kp_…`). Si **no** hay secreto global **y** la cuenta no tiene ninguna clave activa, `POST /api/contacts/create` responde **503**. Las peticiones envían el token en `Authorization: Bearer …` o en cabecera `X-Capture-Secret`. En el cuerpo JSON usa **`accountSlug`** (p. ej. `demo`), no hace falta exponer el `id` interno de la cuenta.

6. **Formulario `/lead` (opcional):** si quieres probar captura sin curl, pon `ENABLE_PUBLIC_LEAD_FORM=true` en `.env`. No sustituye a landings externas: para eso usa un proxy serverless (ver `docs/capture-integration.md`).

7. **Crons de servidor (`CRON_SECRET`):** define `CRON_SECRET` en `.env` (mismo patrón que `AUTH_SECRET`). Sin esto, `GET /api/cron/follow-up-due` y `GET /api/cron/kiteprop-property-feed` responden **503**. Las pruebas manuales usan `Authorization: Bearer …`. En Vercel, los crons oficiales envían `x-vercel-cron: 1` (seguimientos: `docs/decisions/slice-s07-follow-up-cron.md`; inventario: `docs/decisions/slice-s22-kiteprop-property-feed.md`). En **Vercel Hobby** el feed KiteProp va **1×/día** en el `vercel.json` del repo; frecuencia mayor requiere **Pro** o sync manual (`docs/decisions/vercel-hobby-cron-daily-kiteprop-feed.md`).

8. **Feeds de inventario (KiteProp u otro origen compatible):** la regla de producto es: con integración KiteProp, consumir links/fichas desde feeds KiteProp; sin KiteProp, usar feeds que alimenten el mismo modelo de `Property` (p. ej. Propieya u otro export compatible). Detalle de criterios: [integracion-kiteprop-propieya.md](./integracion-kiteprop-propieya.md). **URLs en UI:** como admin, en `https://TU-DOMINIO/dashboard/account/property-feeds` (también enlazado desde el centro de configuración) pegar las URLs **HTTPS** del JSON y/o del XML OpenNavent. Ejemplo de prueba (ProperStar vía estático KiteProp): `https://static.kiteprop.com/kp/difusions/f89cbd8ca785fc34317df63d29ab8ea9d68a7b1c/properstar.json`. Activar el feed y usar **Sincronizar ahora** para probar antes del próximo cron. El cron en `vercel.json` está en **~cada 2 días** (02:00 UTC en días impares del mes) durante pruebas — ver `docs/decisions/slice-s32-kiteprop-incremental-json-cron.md`; plan **Hobby** puede limitar frecuencia (`docs/decisions/vercel-hobby-cron-daily-kiteprop-feed.md`).

9. **WhatsApp (Meta):** alta en Meta Business / WhatsApp Cloud API, número y tokens los obtiene el humano. **Webhook:** `WHATSAPP_ACCOUNT_SLUG`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET` (recomendado). URL: `https://TU-DOMINIO/api/webhooks/whatsapp` → `slice-s08-whatsapp-webhook.md`. **Envío:** `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN` (y opcional `WHATSAPP_GRAPH_VERSION`) → `slice-s09-whatsapp-outbound.md`.

10. **Email de seguimiento (Resend):** para que los pasos con `channel: "email"` en los planes JSON envíen correo real, crear API key en [Resend](https://resend.com), verificar dominio/remitente, y en Vercel (o `.env`) definir `RESEND_API_KEY` y `FOLLOW_UP_FROM_EMAIL` (ej. `Nombre <notificaciones@tudominio.com>`). Opcional: `FOLLOW_UP_EMAIL_SUBJECT_PREFIX`. **Sin estas variables**, el cron igual avanza la secuencia y crea una **tarea** en la ficha del contacto para envío manual. Detalle: `docs/decisions/slice-follow-up-channels-email-manual.md`.

11. **Git / GitHub — clave SSH (si `git push` por SSH da `Permission denied (publickey)`):** en la cuenta de GitHub que tenga acceso al repo, [Settings → SSH and GPG keys](https://github.com/settings/keys) → **New SSH key** → pegar **solo** el contenido del archivo **público** (p. ej. `%USERPROFILE%\.ssh\id_ed25519_github.pub`, una línea que empieza por `ssh-ed25519`). **No** subas ni compartas la clave **privada** (archivo sin `.pub`). Tras guardar, probar `ssh -T git@github.com` y luego `git fetch` / `git push`. Si usas `~/.ssh/config` con `Host github.com`, `IdentityFile` debe apuntar a la **clave privada** que corresponde a esa `.pub`. **Contexto técnico y convención de claves:** `docs/decisions/github-ssh-windows-dev.md`.

---

### 3. Actualizar instalación tras el bootstrap monorepo (una sola vez)

Si tenías una versión anterior del repo (Next y Prisma en la raíz, sin `apps/` ni `packages/`):

1. Cierra procesos que usen `node_modules` (por ejemplo `npm run dev`).
2. En la raíz del proyecto, borra la carpeta `node_modules` y el archivo `package-lock.json`.
3. Ejecuta de nuevo: `npm install`.
4. Crea o actualiza `.env` en la raíz (paso 2 de arriba).
5. Aplica migraciones: `npm run db:migrate:deploy` y, si quieres datos demo, `npm run db:seed`.

**Por qué:** npm workspaces enlaza `@kite-prospect/web` y `@kite-prospect/db`; un lock antigua puede fallar o apuntar a rutas que ya no existen.

---

### 4. Aplicar migración del campo `password` en User

**Qué hacer:** Ejecutar migración para agregar el campo `password` al modelo `User`.

**Pasos:**

1. Desde la raíz: `npm run db:migrate`
2. Nombre sugerido: `add_password_to_user`
3. Si ya tienes datos en `User`, la migración fallará (campo NOT NULL sin default). Opciones:
   - **Opción A (recomendada para desarrollo):** `npm run db:reset` (borra todo y vuelve a seed)
   - **Opción B:** Editar la migración SQL para hacer `password` nullable temporalmente, luego actualizar datos, luego hacer NOT NULL

**Por qué:** El schema cambió para incluir autenticación.

---

## Más adelante (cuando implementemos cada integración)

### 5. WhatsApp Business API (Fase 1 / cuando toque el canal)

**Qué harás tú:**

1. Tener una cuenta de **Meta Business** y una app en [Meta for Developers](https://developers.facebook.com/).
2. Configurar el producto **WhatsApp** en la app.
3. Obtener **Phone Number ID**, **Access Token** y (si aplica) verificar el número de negocio.
4. Pegar en `.env` (raíz): `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`; opcional `WHATSAPP_GRAPH_VERSION` (por defecto `v21.0`). Para el webhook ya documentados: `WHATSAPP_ACCOUNT_SLUG`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`.

**URLs útiles:**

- [Meta for Developers](https://developers.facebook.com/)
- Documentación WhatsApp Cloud API: buscar en la ayuda oficial de Meta "WhatsApp Cloud API".

---

### 6. Proveedor de IA (motor conversacional — S10)

**Implementado con OpenAI** (HTTP). Variables: `OPENAI_API_KEY` (obligatorio para usar la API), opcional `OPENAI_MODEL` (por defecto `gpt-4o-mini`).

**Qué harás tú:**

1. Entrá en [https://platform.openai.com](https://platform.openai.com) → [API keys](https://platform.openai.com/api-keys) → **Create new secret key**.
2. Copiá la clave (`sk-...`) y pegala en `.env` y en **Vercel → Environment Variables** como `OPENAI_API_KEY`.
3. En **Billing** de OpenAI, activá facturación si el panel lo exige para usar la API.

**Guía detallada:** [configuracion-manual-paso-a-paso.md §4](./configuracion-manual-paso-a-paso.md#4-openai-motor-conversacional-s10).

**Decisión de negocio:** presupuesto y límites de uso en OpenAI (no inferibles desde el código).

**Opcional — inferencia de perfil con LLM (F2-E1):** en `.env` / Vercel, `SEARCH_PROFILE_INFER_LLM=true` activa un refinamiento JSON tras las heurísticas (mismo proveedor que `AI_PROVIDER` / `OPENAI_API_KEY`). Sin esto solo corre el camino heurístico.

---

### 6b. Meta Lead Ads — webhook (Fase 2)

**Qué harás tú:**

1. En Meta for Developers, creá el webhook de **Lead Ads** apuntando a `https://TU-DOMINIO/api/webhooks/meta-leads` (GET para verificación, POST para eventos).
2. Definí en el entorno `META_LEAD_WEBHOOK_VERIFY_TOKEN` (mismo valor que configurás como **Verify Token** en Meta).
3. **Recomendado (producción):** definí `META_LEAD_WEBHOOK_APP_SECRET` con el **App Secret** de la app Meta que recibe el webhook. Con eso el servidor valida `X-Hub-Signature-256` en el POST; sin esa variable el POST sigue aceptando cuerpos sin firma (útil en local).
4. **Vinculación de página:** en la app, **admin** → `/dashboard/account/integrations` → sección Meta Lead Ads: crear o editar el **pageId** numérico de la página de Facebook. Alternativa equivalente: insertar en base `Integration` con `type = "meta_lead_ads"`, `status = "active"`, `config` JSON `{ "pageId": "<PAGE_ID_DE_META>" }`. Sin esa fila el POST se reconoce pero no asocia cuenta (`ignored` en logs).

**Notas:** el ingest usa el mismo modelo de captura que `POST /api/contacts/create` (canal `meta_lead`). Si el lead no trae email ni teléfono válido, la captura falla pero el webhook responde 200 para no forzar reintentos infinitos de Meta.

---

### 7. Autenticación en producción (cuando despliegues)

**Qué harás tú:**

1. Elegir dominio y URL de la app (ej. `https://app.tudominio.com`).
2. Configurar variables de sesión / OAuth según lo que implementemos (NextAuth, Clerk, etc.).
3. Generar secretos seguros (`openssl rand -base64 32` o equivalente) y guardarlos solo en el entorno de producción, nunca en el repo.

---

### 8. Primera cuenta de inmobiliaria (producción)

**Qué harás tú:**

1. Dar de alta manualmente la primera **Account** (tenant) y el usuario **admin**, o ejecutar un script de seed que documentemos.
2. Definir nombre comercial, slug y roles iniciales.

---

### 9. MCP de KiteProp (Cursor / Claude Code)

**Qué es:** servidor [MCP](https://github.com/kiteprop/crm-mcp) que expone el CRM KiteProp como herramientas para el asistente. **No forma parte del runtime de Kite Prospect**; es configuración del IDE.

**Guía completa (global para todos los proyectos, variables, prueba API, fallback por repo):** [kiteprop-mcp-setup.md](./kiteprop-mcp-setup.md).

**Resumen:** la configuración recomendada es **`%USERPROFILE%\.cursor\mcp.json`** (Windows) o **`~/.cursor/mcp.json`** (Mac/Linux), con el bloque `kiteprop` y tu `KITEPROP_API_TOKEN` personal (`kp_…`). Plantilla sin secretos: [`.mcp.json.example`](../.mcp.json.example) o [`docs/templates/kiteprop-cursor-mcp.json.example`](./templates/kiteprop-cursor-mcp.json.example).

**No compartas la API key en el chat**; rotala si se filtró. **No** uses `www.kiteprop.com` como URL por defecto: solo API **demo/staging** acordada (`docs/decisions/kiteprop-frontera-demo-y-produccion.md`).

---

## Decisiones de negocio pendientes (cuando aplique)

| Tema | Qué decidir |
|------|-------------|
| Pesos del score total | Cómo combinar Intent / Readiness / Fit / Engagement en un único `totalScore` (porcentajes). |
| Umbrales de derivación | A partir de qué score o evento pasa el lead a humano automáticamente. |
| Plantillas WhatsApp | Textos aprobados por Meta y tono comercial permitido. |

Cuando tomes una decisión, conviene reflejarla en `docs/product-rules.md` o en configuración por cuenta (`Account.config`).

---

## Cómo usar este archivo

- Antes de pedirte algo, el equipo / la IA debe comprobar si ya está listado aquí.
- Si aparece una acción nueva que requiere humano, **añádela a este documento** con pasos numerados y URLs.
