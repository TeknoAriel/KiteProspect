# Configuración única: deploys automáticos (sin tocar Vercel en cada cambio)

**Objetivo:** que cada `git push` a `main` despliegue solo. El agente en el repo hace commit/push; **no hace falta** “Deploy” manual en el panel salvo emergencias.

**Lo que el agente no puede hacer por ti:** iniciar sesión en Vercel/GitHub/Neon en tu navegador. Esto se configura **una vez**.

---

## 1) GitHub ↔ Vercel (imprescindible)

1. [Vercel](https://vercel.com) → **Add New** → **Project** → importar el repo **KiteProspect** (GitHub).
2. **Production Branch** = `main` (o la que uses).
3. Activar **Automatic deployments** para Production al hacer push a esa rama (viene por defecto al importar).

**Después de esto:** cada push del agente a `main` → nuevo deployment. No tenés que pulsar “Deploy”.

---

## 2) Root Directory y build (evita error `apps/web/apps/web` y builds rotos)

El monorepo tiene el `vercel.json` en **`apps/web`**. En el proyecto de Vercel:

| Campo | Valor recomendado |
|--------|-------------------|
| **Root Directory** | `apps/web` |

Así el “directorio del proyecto” es la app Next; el `vercel.json` allí ya define:

- `installCommand`: `cd ../.. && npm install`
- `buildCommand`: `cd ../.. && npm run build:vercel` (migraciones + seed + build)

**No ejecutes** el CLI desde `apps/web` si el proyecto ya tiene Root `apps/web` (puede duplicar rutas). Para deploy **no necesitás CLI**: basta el push.

Si alguna vez necesitás CLI: enlazá desde la **raíz del repo** con `vercel link` y seguí la doc de monorepos, o ignorá el CLI y usá solo Git.

---

## 3) Variables de entorno en Vercel (Production)

En **Settings → Environment Variables** (ambiente **Production**), replicá lo necesario según `.env.example` en la raíz del monorepo. Mínimo habitual:

- `DATABASE_URL` (Neon u otro Postgres de producción)
- `AUTH_SECRET`, `AUTH_URL` (URL pública exacta, **sin** `/` final)
- `GEMINI_API_KEY` (y opcional `GEMINI_MODEL`, p. ej. `gemini-2.5-flash-lite`)
- `CRON_SECRET` (cron y `/api/health/ai`)
- Captura: `CAPTURE_API_SECRET` si usás la API pública
- WhatsApp: variables de `slice-s08` / `slice-s09` si usás ese canal

**Build en Vercel** usa esas variables; no hace falta `.env` en el repo (está en `.gitignore`).

---

## 4) Qué hace el agente vs qué hacés vos

| Quién | Acción |
|--------|--------|
| **Agente** | Código, `npm run verify`, commit, `git push` a `main`. |
| **Vercel (automático)** | Build + deploy al recibir el push. |
| **Vos (una vez + pruebas)** | Conectar repo, Root Directory, variables, probar URL. |

**No hace falta** colaboración en cada iteración: solo reportar si el deployment en Vercel falla (log de build) o si falta una variable.

---

## 5) Comprobar que todo anda

1. Tras un push: Vercel → **Deployments** → último = **Ready**.
2. Abrir ese deployment y confirmar que el **commit** coincide con GitHub → rama `main` (mismo hash que el último push).
3. `GET https://TU_DOMINIO/api/health` → `ok: true`.

Si el paso 2 falla (Vercel sigue en un commit viejo): **no es un problema del repo** — revisar conexión Git en Vercel → `docs/decisions/vercel-deploy-lag-behind-github.md`.

---

## Referencias

- `docs/decisions/vercel-build-migrations-seed.md` — build con migraciones y seed.
- `.env.example` — nombres de variables.
- `docs/manual-actions-required.md` — resto de acciones solo humanas.
