# Flujo de trabajo del agente y política de errores

## Principio

- **El agente (Cursor / CI) ejecuta** comandos del repo, corrige código y deja documentado lo implementado.
- **La persona solo valida** en UI (Vercel, Neon, login) cuando hace falta comprobar credenciales que **no** están en el repositorio.
- **No** se debe pedir a la persona que ejecute scripts rutinarios si el pipeline puede hacerlo (p. ej. migraciones en el deploy).

## Errores frecuentes y resolución

| Código / síntoma | Causa | Resolución automática / en repo |
|------------------|--------|----------------------------------|
| **P1001** `Can't reach database server at localhost` | `DATABASE_URL` en `.env` apunta a Postgres local que no está encendido | En **producción**: el build de Vercel usa `DATABASE_URL` del panel (Neon), no `.env` local. Migraciones + seed corren en `npm run build:vercel`. Local: cambiar `.env` a Neon o arrancar Postgres. |
| **Credenciales inválidas** (login) | No existe usuario demo en la misma BD que Vercel | **Seed en build de Vercel** (`build:vercel`) para que exista `demo` / `admin@demo.local` tras el deploy. |
| **Build Vercel: .next no encontrado** | Monorepo | **Root Directory** = `apps/web` + `vercel.json` (ya documentado). |
| **CI verde, producción distinta** | Variables solo en Vercel | Revisar **Environment Variables** en Vercel; no duplicar secretos en Git. |

## Qué ejecuta quién

| Acción | Dónde |
|--------|--------|
| `npm run verify` | Agente / GitHub Actions (sin BD) |
| `npm run build:vercel` | **Solo Vercel** (migrate + seed + next build) |
| `npm run db:*` con `dotenv -e .env` | Máquina local **solo si** hay `.env` con BD alcanzable |

## Referencias

- `docs/working-rules.md`
- `docs/decisions/vercel-build-migrations-seed.md`
