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

## Referencias

- `package.json` — scripts `build:vercel`, `db:migrate:deploy:raw`, `db:seed:raw`
- `apps/web/vercel.json`
