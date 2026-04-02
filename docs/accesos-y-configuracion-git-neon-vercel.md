# Accesos y configuración: Git · Neon · Vercel

Guía de **enlaces oficiales** y **valores exactos** para este proyecto (**monorepo** en la raíz del repositorio).

Tu app en Vercel (reemplazá por tu URL real: **Deployments → Visit**): **`https://TU-DEPLOYMENT.vercel.app`**

---

## 1) Git — repositorio de código (GitHub)

Git “en la nube” casi siempre se usa con **GitHub**. Aquí no guardas la base de datos; solo el **código** que Vercel descarga para construir el sitio.

### URLs de acceso

| Para qué | URL |
|----------|-----|
| Página principal | https://github.com |
| Crear cuenta / entrar | https://github.com/signup |
| Iniciar sesión | https://github.com/login |
| Crear un repositorio nuevo (vacío) | https://github.com/new |
| Tus repositorios | https://github.com?tab=repositories |

### Configuración recomendada (repositorio)

| Campo / opción | Valor recomendado |
|----------------|-------------------|
| Nombre del repo | El que quieras, ej. `kite-prospect` |
| Visibilidad | **Private** (privado) si el código no debe ser público |
| README / .gitignore | Puedes dejar los que sugiera GitHub; el proyecto ya trae `.gitignore` |

### Flujo mínimo (quién ya tiene el código en su PC)

1. En GitHub: **New repository** → crea el repo (sin subir archivos todavía si ya tienes carpeta local).
2. En tu PC, en la carpeta del proyecto, enlaza y sube (quien maneje Git ejecuta `git remote add` + `git push`).  
   *Si no usas Git tú mismo, solo necesitas que el código esté en un repo conectado a Vercel.*

### Conectar GitHub con Vercel (después de tener repo)

- En Vercel: **Add New** → **Project** → **Import Git Repository** → autoriza **GitHub** y elige el repositorio.

### SSH (GitHub) — push/fetch desde tu PC (Windows)

Si usas URL **`git@github.com:…`** y ves `Permission denied (publickey)`:

1. Clave dedicada + `~/.ssh/config` (ver decisión **`docs/decisions/github-ssh-windows-dev.md`**).
2. En GitHub: [SSH and GPG keys](https://github.com/settings/keys) → pegar solo el archivo **`.pub`**.
3. Probar: `ssh -T git@github.com` y luego `git fetch` en el clon.

**Remoto de este monorepo (ejemplo):** `git@github.com:kiteprop/ia-kiteprospects.git`

---

## 2) Neon — base de datos PostgreSQL

Neon te da la **cadena de conexión** que pegarás en Vercel como `DATABASE_URL`.

### URLs de acceso

| Para qué | URL |
|----------|-----|
| Web principal / registro | https://neon.tech |
| Consola (dashboard) tras login | https://console.neon.tech |

### Pasos en Neon (orden)

1. Entra en **https://neon.tech** → **Sign up** (GitHub o Google).
2. Crea un **Project** (nombre libre, región la más cercana a tus usuarios, ej. **South America** si existe).
3. Dentro del proyecto, crea una **base** (suele crearse una por defecto).
4. Abre **Connection details** / **Connect** (según la versión del panel).
5. Elige tipo **URI** o **Connection string** que empiece por **`postgresql://`**
6. **Copia** el texto completo (una sola línea). Ese valor es tu **`DATABASE_URL`**.

### Configuración precisa (valores típicos)

| Opción en Neon | Qué elegir |
|----------------|------------|
| Motor | **PostgreSQL** (por defecto) |
| Región | La más cercana a tu público (menos latencia) |
| SSL | Suele ir incluido en la URI (`sslmode=require`); **no** quites eso |
| Roles / usuario | El que genere Neon por defecto está bien para empezar |

### Qué NO hace falta tocar al inicio

- Extensiones raras, pooling avanzado: opcional más adelante.
- **IP allowlist** para Vercel: normalmente **no** bloquees; Neon acepta conexiones con usuario/clave de la URI.

### Dónde ver la cadena otra vez

- **Neon Console** → tu proyecto → **Dashboard** → sección de conexión / **Connection string**.

---

## 3) Vercel — hosting y variables del sitio

Vercel **construye** la app desde GitHub y la publica en una **URL** (ej. `*.vercel.app`).

### URLs de acceso

| Para qué | URL |
|----------|-----|
| Entrada / login | https://vercel.com |
| Registro | https://vercel.com/signup |
| Tus proyectos (dashboard) | https://vercel.com/dashboard |
| Documentación (builds, env) | https://vercel.com/docs |

### Crear / importar proyecto (orden)

1. **https://vercel.com** → **Log in** (recomendado: **Continue with GitHub**).
2. **Add New…** → **Project**.
3. **Import** el repositorio de GitHub (autoriza a Vercel a leer repos si lo pide).
4. Antes de **Deploy**, abre **Configure Project** (o equivalente) y ajusta lo de la tabla siguiente.

### Configuración precisa del proyecto (este monorepo)

El `package.json` está en la **raíz** del repo y el build de Next corre con workspaces. Usa **siempre la raíz del repositorio** como carpeta del proyecto en Vercel.

| Campo en Vercel | Valor exacto |
|-----------------|--------------|
| **Framework Preset** | **Next.js** (si no lo detecta, sigue la tabla de comandos) |
| **Root Directory** | **.** o **dejar vacío** = raíz del repo (**no** pongas solo `apps/web` sin guía adicional; el monorepo instala desde la raíz) |
| **Install Command** | `npm install` |
| **Build Command** | `npm run build` |
| **Output Directory** | Déjalo **por defecto** (Next.js lo gestiona) |
| **Node.js Version** | **20.x** (Settings → General → Node.js Version, si existe la opción) |

Si el asistente de Vercel insiste en otra carpeta, lo importante es: **instalar en la raíz** y **build** = `npm run build` desde esa raíz.

### Variables de entorno (Production)

Ruta en el panel: **Project** → **Settings** → **Environment Variables**.

Marca el entorno **Production** (y **Preview** si quieres lo mismo en ramas de prueba).

| Name (nombre exacto) | Value (qué pegar) |
|----------------------|-------------------|
| `DATABASE_URL` | La URI **completa** de Neon (`postgresql://...`) |
| `AUTH_SECRET` | Secreto largo (ej. desde https://generate-secret.vercel.app/32 ) |
| `AUTH_URL` | `https://TU-DEPLOYMENT.vercel.app` — **sin** `/` al final |
| `CAPTURE_API_SECRET` | Otro secreto distinto (opcional; para API de captura) |
| `ENABLE_PUBLIC_LEAD_FORM` | `true` o no crear la variable |

**Después de guardar variables:** **Deployments** → último deploy → **⋯** → **Redeploy**.

### Dominio

| Dónde | Qué hacer |
|-------|-----------|
| **Settings** → **Domains** | Verás tu `*.vercel.app` (ej. `TU-DEPLOYMENT.vercel.app`) o el dominio custom; puedes añadir dominio propio más adelante. |

---

## 4) Orden recomendado (checklist)

1. **GitHub:** repo creado y código subido.  
2. **Neon:** proyecto + copiar `DATABASE_URL`.  
3. **Vercel:** importar repo → configurar **Install** / **Build** como arriba → añadir **variables** → **Deploy** / **Redeploy**.  
4. **Base de datos:** ejecutar migraciones una vez (ver `docs/paso-a-paso-sin-programar.md`, Parte C): `npm run db:migrate:deploy` con esa `DATABASE_URL`.

---

## 5) Tabla única de “accesos rápidos”

| Servicio | Entrar |
|----------|--------|
| GitHub | https://github.com/login |
| Neon | https://console.neon.tech |
| Vercel | https://vercel.com/dashboard |
| Tu sitio (ejemplo) | https://TU-DEPLOYMENT.vercel.app |
| Login app | https://TU-DEPLOYMENT.vercel.app/login |
| Generar secreto | https://generate-secret.vercel.app/32 |

---

## 6) Documentos relacionados en este repo

- `docs/paso-a-paso-sin-programar.md` — guía detallada sin saber programar.  
- `docs/paso-a-paso-vercel-kiteprospect.md` — checklist con placeholder `TU-DEPLOYMENT.vercel.app`.  
- `.env.example` — nombres de variables que debe respetar el hosting.
