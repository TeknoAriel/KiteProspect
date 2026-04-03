# Guía para ti — qué abrir en el navegador y en qué orden

Esta página usa **dos “bases” de URL** que sí funcionan; solo cambia el **origen** (inicio de la dirección):

| Dónde corres la app | Base (origen) — copia exacta |
|---------------------|------------------------------|
| **En tu PC** con `npm run dev` | `http://localhost:3000` |
| **En internet** (Vercel, Railway, etc.) | La que te muestra el navegador al abrir el sitio, por ejemplo `https://algo.vercel.app` o tu dominio propio |

**Regla simple:** todas las rutas de la app son **las mismas**; solo pegas tu base delante.

- Local: `http://localhost:3000` + `/login` → **`http://localhost:3000/login`**
- Producción: `https://mi-app.vercel.app` + `/login` → **`https://mi-app.vercel.app/login`**

> **Importante:** en producción suele ser **https://**. En local, Next.js usa **http://** y el puerto **3000** salvo que hayas cambiado el puerto.

## 0) Salud del sitio (`/api/health`)

Abre **`TU_BASE/api/health`** (ej. `https://tu-app.vercel.app/api/health`). Es **público** y **no** muestra secretos.

- **`ok` / `database`:** si la app llega a PostgreSQL.
- **`demoUser`:** si en **esa** base existe el usuario demo (el deploy con `build:vercel` corre seed; si no, verás `false`).
- **`issues`:** en **producción** (Vercel) puede listar `auth_url_falta_produccion` si falta `AUTH_URL` con la URL pública exacta.
- **`integrations`:** solo **sí/no** (¿está definida la variable?) para captura API, cron, email Resend, WhatsApp webhook/saliente, IA. No comprueba que Meta o Resend respondan.

Detalle técnico: `docs/decisions/slice-s31-production-readiness-health.md`.

### Despliegue en Vercel (tras `git push`)

Si el repo está conectado a Vercel, cada push a la rama de producción (p. ej. `main`) **dispara un deploy** automático. Revisá **Deployments** en el panel del proyecto hasta ver **Ready**.

Si usás `vercel deploy` en la terminal y aparece un error con ruta `apps/web/apps/web`, corregí **Root Directory** en la configuración del proyecto o usá solo el flujo por Git; detalle en `docs/decisions/vercel-build-migrations-seed.md`.

---

## 1) Variables en el hosting (solo producción en internet)

En el panel de tu proveedor (Vercel, Railway, Fly.io, …) configura:

| Variable | Obligatorio | Valor típico |
|----------|-------------|--------------|
| `DATABASE_URL` | Sí | Cadena PostgreSQL de **esa** base (producción). |
| `AUTH_SECRET` | Sí | Secreto largo aleatorio (distinto al de tu PC). |
| `AUTH_URL` | Sí en producción | **Exactamente** la URL pública de la app, **sin barra al final**. Ejemplo: `https://mi-app.vercel.app` |
| `CAPTURE_API_SECRET` | Si usarás la API de captura | Otro secreto (no el mismo que `AUTH_SECRET`). |
| `ENABLE_PUBLIC_LEAD_FORM` | Opcional | `true` si quieres que funcione el formulario en `/lead`. |
| `CRON_SECRET` | Recomendado | Para probar a mano los crons (`Authorization: Bearer …`); en Vercel los crons oficiales usan cabecera propia. |
| `RESEND_API_KEY` + `FOLLOW_UP_FROM_EMAIL` | Opcional | Si faltan, los pasos `email` del seguimiento crean **tarea** en ficha en lugar de enviar mail. |
| `WHATSAPP_*` / `GEMINI_API_KEY` o `OPENAI_API_KEY` | Opcional | Según canales que uses; ver `docs/manual-actions-required.md`. |

Migraciones sobre la base de producción (una vez, con `DATABASE_URL` apuntando ahí):

```bash
npm run db:migrate:deploy
```

**Seed:** si **no** corres `db:seed` en producción, el usuario `admin@demo.local` **no existirá** (es normal).

---

## 2) Lista de rutas (path) — siempre iguales

Estas son las **rutas** (lo que va después del dominio). Funcionan igual en local y en producción.

| # | Ruta | Para qué sirve |
|---|------|----------------|
| 0 | `/api/health` | Diagnóstico público: BD, demo, variables clave (sin secretos). Ver §0 arriba. |
| 1 | `/` | Portada: enlaces a login y al formulario demo. |
| 2 | `/login` | Pantalla de login (slug de cuenta + email + contraseña). |
| 3 | `/dashboard` | Panel principal (requiere sesión). |
| 4 | `/dashboard/contacts` | Lista de contactos. |
| 5 | `/dashboard/inbox` | Inbox de conversaciones. |
| 6 | `/dashboard/followups` | Seguimiento. |
| 7 | `/dashboard/audit` | Auditoría (**solo usuario con rol admin**). |
| 8 | `/dashboard/account` | Configuración de la cuenta (**solo admin**): datos del tenant + enlace a IA. |
| 9 | `/lead` | Formulario público (**solo si** `ENABLE_PUBLIC_LEAD_FORM=true`). |
| 10 | `/lead?slug=demo` | Igual que `/lead` pero fija la cuenta `demo` por URL. |

---

## 3) URLs que puedes copiar y pegar — **local** (desarrollo)

Con la app en marcha (`npm run dev`), estas direcciones **sí responden** en tu máquina:

| Paso | URL completa (local) |
|------|----------------------|
| Portada | [http://localhost:3000/](http://localhost:3000/) |
| Login | [http://localhost:3000/login](http://localhost:3000/login) |
| Panel | [http://localhost:3000/dashboard](http://localhost:3000/dashboard) |
| Contactos | [http://localhost:3000/dashboard/contacts](http://localhost:3000/dashboard/contacts) |
| Inbox | [http://localhost:3000/dashboard/inbox](http://localhost:3000/dashboard/inbox) |
| Seguimiento | [http://localhost:3000/dashboard/followups](http://localhost:3000/dashboard/followups) |
| Auditoría (admin) | [http://localhost:3000/dashboard/audit](http://localhost:3000/dashboard/audit) |
| Formulario Lead | [http://localhost:3000/lead](http://localhost:3000/lead) |
| Lead cuenta demo | [http://localhost:3000/lead?slug=demo](http://localhost:3000/lead?slug=demo) |

Si algo no carga, comprueba que el servidor esté en **puerto 3000** (mensaje en consola: `localhost:3000`).

---

## 4) URLs en **producción** (tu sitio publicado)

Tu **base** es la única parte que no puedo escribir por ti (cada deploy tiene su URL).

**Cómo obtenerla:**

1. Abre el sitio desde el enlace que te da Vercel/Railway/etc.
2. Mira la **barra de direcciones del navegador** — eso es tu base, por ejemplo:
   - `https://kite-prospect.vercel.app`
   - o `https://crm.tuempresa.com`

**Cómo construir cada URL:**  
`TU_BASE` + ruta de la tabla.

Ejemplo si tu base es `https://kite-prospect.vercel.app`:

| Qué quieres | URL completa |
|-------------|--------------|
| Login | `https://kite-prospect.vercel.app/login` |
| Panel | `https://kite-prospect.vercel.app/dashboard` |
| Contactos | `https://kite-prospect.vercel.app/dashboard/contacts` |

Sustituye `https://kite-prospect.vercel.app` por **tu** URL real (la que ves en el navegador).

---

## 5) Login de prueba (solo si existe cuenta `demo` en esa base)

Esto vale **si** en esa base de datos corriste el seed y existe la cuenta con slug `demo`:

| Campo en pantalla | Valor |
|-------------------|--------|
| Slug de cuenta | `demo` |
| Email | `admin@demo.local` |
| Contraseña | `demo123` |

Si en producción **no** hiciste seed, **no** usarás estos datos; tendrás que crear usuarios por otro medio.

---

## 6) Probar la API de captura (opcional)

Solo con `CAPTURE_API_SECRET` definido en el hosting.

En **PowerShell**, cambia `TU_BASE` y `TU_SECRETO`:

```powershell
$base = "https://TU_BASE_REAL"   # ej. https://kite-prospect.vercel.app
$secret = "EL_VALOR_DE_CAPTURE_API_SECRET"
$body = '{"accountSlug":"demo","email":"prueba@example.com","name":"Prueba","message":"Hola","channel":"form"}'
Invoke-RestMethod -Uri "$base/api/contacts/create" -Method POST -Headers @{
  Authorization = "Bearer $secret"
  "Content-Type" = "application/json"
} -Body $body
```

**Local (misma máquina con `npm run dev`):**

```powershell
$base = "http://localhost:3000"
$secret = "TU_CAPTURE_API_SECRET_DEL_ARCHIVO_.env"
# ... mismo $body e Invoke-RestMethod que arriba
```

Respuesta esperada (200): JSON con `contactId` y `conversationId`.

| Código | Significado |
|--------|-------------|
| 503 | Falta `CAPTURE_API_SECRET` en el entorno. |
| 401 | Secreto incorrecto en la cabecera. |
| 404 | No existe `accountSlug` en la base. |

---

## 7) Después de enviar un lead (comprobar)

1. **Contactos** — `TU_BASE/dashboard/contacts`  
2. **Inbox** — `TU_BASE/dashboard/inbox`  
3. **Auditoría** (admin) — `TU_BASE/dashboard/audit` — buscar evento `lead_captured`

---

## Referencias

- Variables: `.env.example`
- Captura detallada: `docs/capture-integration.md`
- Acciones manuales genéricas: `docs/manual-actions-required.md`
