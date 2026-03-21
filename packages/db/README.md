# @kite-prospect/db

Paquete de persistencia: **Prisma** + cliente compartido.

- **Schema:** `prisma/schema.prisma`
- **Migraciones:** `prisma/migrations/`
- **Seed:** `prisma/seed.ts` (datos demo; idempotente si ya existe `slug=demo`)

Desde la **raíz del monorepo** usar los scripts `npm run db:*` (ver `README.md` raíz).
