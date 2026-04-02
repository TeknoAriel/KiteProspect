# Flujo completo alineado — pantalla por pantalla

Este documento une **GitHub**, **Neon**, **Vercel** y la **app web** en un solo recorrido.  
Incluye **qué puede ejecutarse sin secretos** en el repo y **qué solo tú controlas** (credenciales).

---

## 1) Mapa mental (orden correcto)

```text
[GitHub: código]  →  [Vercel: build + env]  →  [Neon: PostgreSQL]
        ↑                        ↓
   push / PR              URL pública + login
```

1. El **código** vive en **GitHub**.  
2. **Vercel** lee ese código, instala dependencias, hace `npm run build` y publica la URL.  
3. **Neon** guarda los datos; la app se conecta con `DATABASE_URL` que **solo** está en Vercel (no en el repo).

**Alineación:** mismos nombres de variables que `.env.example` en la raíz; en Vercel se pegan los **valores reales**.

---

## 2) Qué ejecuta sin secretos (asistente / CI / tú en local)

| Dónde | Comando / acción | ¿Necesita DATABASE_URL / AUTH_SECRET? |
|-------|------------------|----------------------------------------|
| Tu PC o Cursor | `npm install` + `npm run verify` | **No** (solo compila y comprueba tipos) |
| GitHub Actions | Workflow **CI** (`.github/workflows/ci.yml`) | **No** |

**Secretos** (`DATABASE_URL`, `AUTH_SECRET`, etc.) **no** van al repositorio.  
Están en `.gitignore` (`.env`) y en el panel de **Vercel** / **Neon**.

---

## 3) GitHub — pantalla por pantalla

**URLs:** https://github.com · login: https://github.com/login

| Paso | Pantalla / menú | Qué haces |
|------|-----------------|-----------|
| 1 | Home → **Sign in** | Entras con tu usuario. |
| 2 | Esquina superior derecha **+** → **New repository** (o https://github.com/new) | Creas el repo (nombre libre, ej. `kite-prospect`). **Private** recomendado. |
| 3 | Repo vacío o con código | Si ya tienes carpeta local, quien use Git hace `git remote` + `git push` (o subes desde GitHub Desktop). |
| 4 | Pestaña **Settings** → **Secrets and variables** → **Actions** | Opcional: aquí **no** es obligatorio para este repo; los secretos de app van en **Vercel**, no en GitHub, salvo que más adelante añadas un workflow que despliegue migraciones (avanzado). |
| 5 | Pestaña **Actions** | Tras cada push a `main`/`master`, verás el workflow **CI** (verde = `verify` OK). |

**Comprobación:** en **Actions → último run** debe estar **verde**. Eso confirma que el código del repo **compila** sin necesidad de base de datos.

---

## 4) Neon — pantalla por pantalla

**URLs:** https://neon.tech · consola: https://console.neon.tech

| Paso | Pantalla | Qué haces |
|------|----------|-----------|
| 1 | Home → **Sign up** | Cuenta (GitHub/Google). |
| 2 | **Create project** | Nombre, región (ej. cercana a usuarios). |
| 3 | Dashboard del proyecto | Busca **Connection string** / **Connect** / **Connection details**. |
| 4 | Formato **URI** | Copia **toda** la línea `postgresql://...` (una sola línea). |
| 5 | Guardar en sitio seguro | Ese texto será el valor de **`DATABASE_URL`** en Vercel (no lo pegues en GitHub ni en issues). |

**Comprobación:** en Neon, el proyecto aparece **Active**; puedes abrir **Tables** / SQL más adelante si Neon lo muestra.

---

## 5) Vercel — pantalla por pantalla

**URLs:** https://vercel.com · dashboard: https://vercel.com/dashboard

| Paso | Pantalla | Qué haces |
|------|----------|-----------|
| 1 | **Log in** → **Continue with GitHub** | Vinculas Vercel con GitHub. |
| 2 | **Add New…** → **Project** | **Import** el repositorio de Kite Prospect. |
| 3 | **Configure Project** (antes de Deploy) | **Root Directory:** ` ` (vacío / raíz del repo). **Install:** `npm install`. **Build:** `npm run build`. **Framework:** Next.js si lo detecta. |
| 4 | **Environment Variables** (mismo asistente o **Settings → Environment Variables**) | Añades filas de la tabla de abajo (Production). |
| 5 | **Deploy** | Esperas a **Ready**. |
| 6 | **Deployments** → último → **Visit** | Copias la URL real (ej. `https://TU-DEPLOYMENT.vercel.app`). |
| 7 | **Settings** → **General** → **Node.js Version** | **20.x** si existe la opción. |
| 8 | Tras cambiar variables | **Redeploy** del último deployment. |

**Variables (nombres exactos — valores los pones tú):**

| Name | Value (origen) |
|------|----------------|
| `DATABASE_URL` | URI completa de Neon |
| `AUTH_SECRET` | Secreto largo (ej. https://generate-secret.vercel.app/32 ) |
| `AUTH_URL` | URL pública **sin** `/` final, la que ves en **Visit** |
| `CAPTURE_API_SECRET` | Opcional; otro secreto |
| `ENABLE_PUBLIC_LEAD_FORM` | Opcional: `true` |

**Comprobación:** `Visit` abre la home sin error 500; `/login` muestra el formulario.

---

## 6) Base de datos: tablas (una vez)

No es una “pantalla” web: se ejecuta **una vez** con la misma `DATABASE_URL` que Neon (en `.env` local o en un entorno seguro):

```bash
npm run db:migrate:deploy
```

Opcional (usuario demo `demo` / `admin@demo.local` / `demo123`):

```bash
npm run db:seed
```

**Comprobación:** login en la app funciona **solo si** seed se aplicó en **esa** base.

---

## 7) App web — pantalla por pantalla (navegador)

Sustituye `BASE` por la URL que te da Vercel (**Visit**).

| Paso | URL | Qué deberías ver |
|------|-----|-------------------|
| 1 | `BASE/` | Portada con enlaces. |
| 2 | `BASE/login` | Formulario: slug, email, contraseña. |
| 3 | Tras login correcto | `BASE/dashboard` |
| 4 | Datos | `BASE/dashboard/contacts`, `BASE/dashboard/inbox` |
| 5 | Admin | `BASE/dashboard/audit` |
| 6 | Formulario público (si `ENABLE_PUBLIC_LEAD_FORM=true`) | `BASE/lead` |

---

## 8) Matriz: quién hace qué (sin solapar secretos)

| Tarea | GitHub repo | Vercel | Neon | Asistente IA |
|-------|-------------|--------|------|--------------|
| `npm run verify` | ✅ (local) / ✅ CI | — | — | ✅ en tu máquina |
| Ver `DATABASE_URL` real | ❌ no está en repo | ✅ panel | ✅ panel | ❌ no accede |
| Cambiar código | ✅ PR / push | redeploy automático | — | ✅ si editas archivos |
| Migraciones | comando local con `.env` | — | datos ahí | ❌ sin tu `.env` |

---

## 9) “Todo alineado” — checklist final

- [ ] **GitHub:** código subido; **Actions** CI en verde.  
- [ ] **Neon:** proyecto + `DATABASE_URL` copiada.  
- [ ] **Vercel:** import desde GitHub; build `npm run build` desde raíz; variables; **AUTH_URL** = URL real.  
- [ ] **Migraciones:** `db:migrate:deploy` hecho contra esa base.  
- [ ] **Opcional:** `db:seed`.  
- [ ] **Navegador:** home + login + dashboard OK.

---

## 10) Documentos relacionados

| Archivo | Contenido |
|---------|-----------|
| `docs/accesos-y-configuracion-git-neon-vercel.md` | URLs y ajustes por servicio |
| `docs/paso-a-paso-sin-programar.md` | Guía detallada sin programar |
| `.env.example` | Nombres de variables (sin valores secretos) |

---

## 11) Por qué no puedo “ver” tus secretos (y está bien)

Los secretos **no** están en el repo para que **nadie** (ni tú por error) los suba a GitHub.  
El asistente puede **verificar código** (`verify`, CI) y **guiarte** con listas; **no** puede abrir tu panel de Vercel ni Neon.  
Si quieres máxima automatización futura, el patrón estándar es **GitHub Actions** con **Secrets** solo en GitHub para tareas puntuales (p. ej. migraciones), documentado aparte cuando lo necesites.
