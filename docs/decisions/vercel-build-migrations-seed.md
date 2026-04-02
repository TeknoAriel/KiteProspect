# Decisión: migraciones y seed en el build de Vercel

## Problema

Los comandos `db:migrate:deploy` y `db:seed` dependían de `.env` local con `dotenv-cli`. En Vercel no hay `.env` en disco; las variables vienen del panel. Además se pedía al humano ejecutar migraciones/seed manualmente.

## Decisión

- Script raíz **`npm run build:vercel`**: `db:migrate:deploy:raw` → `db:seed:raw` → `next build` (workspace web).
- **`db:*:raw`** invoca Prisma sin `dotenv -e .env`; usa `DATABASE_URL` del entorno (Vercel).
- **`apps/web/vercel.json`** usa `build:vercel` como `buildCommand` (desde raíz del monorepo).
- El build local habitual sigue siendo **`npm run build`** (solo Next), sin tocar la BD.

## Riesgos

- Cada deploy aplica migraciones pendientes y ejecuta seed (idempotente para cuenta `demo`).
- Si `DATABASE_URL` es incorrecta, el build falla (fallo explícito).

## CLI local y “Root Directory”

Si `vercel deploy` falla con una ruta inexistente tipo `.../apps/web/apps/web`, el proyecto en el panel de Vercel tiene **Root Directory** = `apps/web` y el CLI también se ejecuta como si el subdirectorio se aplicara dos veces.

**Opciones (elige una):**

1. **Solo Git:** confiar en el deploy automático al hacer **push** a la rama conectada (recomendado).
2. **Corregir el panel:** [Project → Settings → General](https://vercel.com/) → **Root Directory**: dejar en blanco la duplicación errónea o alinear con la [documentación de monorepos de Vercel](https://vercel.com/docs/monorepos) para que coincida con la carpeta desde la que enlazaste el repo.

## Referencias

- `package.json` — scripts `build:vercel`, `db:migrate:deploy:raw`, `db:seed:raw`
- `apps/web/vercel.json`
- Si la URL pública devuelve 404: `docs/decisions/vercel-404-diagnostico.md`
