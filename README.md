# Kite Prospect

Plataforma **SaaS multi-tenant** de **prospección inmobiliaria asistida**.

## Monorepo

| Workspace | Descripción |
|-----------|-------------|
| `@kite-prospect/web` | Next.js 14 (`apps/web`) |
| `@kite-prospect/db` | Prisma + cliente compartido (`packages/db`) |
| `@kite-prospect/tsconfig` | Bases TypeScript compartidas |

## Fuentes de verdad

| Documento | Uso |
|-----------|-----|
| [PRODUCT_DEFINITION.md](./PRODUCT_DEFINITION.md) | Alcance del producto — **no inventar features fuera de aquí**. |
| [docs/working-rules.md](./docs/working-rules.md) | **Modo de trabajo permanente** (rol, trazabilidad, qué documentar). |
| [docs/product-rules.md](./docs/product-rules.md) | Reglas operativas. |
| [docs/setup-local.md](./docs/setup-local.md) | Arranque local (paso a paso). |
| [docs/manual-actions-required.md](./docs/manual-actions-required.md) | Lo que solo un humano puede hacer (credenciales, altas, etc.). |
| [docs/produccion-checklist-usuario.md](./docs/produccion-checklist-usuario.md) | **Solo tú en producción:** URLs a abrir, variables del hosting, ejemplos. |
| [docs/paso-a-paso-sin-programar.md](./docs/paso-a-paso-sin-programar.md) | **Implementar sin programar:** Neon, Vercel, variables, enlaces y login demo. |
| [docs/accesos-y-configuracion-git-neon-vercel.md](./docs/accesos-y-configuracion-git-neon-vercel.md) | **GitHub, Neon, Vercel:** URLs y ajustes exactos del proyecto. |
| [docs/flujo-completo-pantalla-a-pantalla.md](./docs/flujo-completo-pantalla-a-pantalla.md) | **Flujo alineado:** repos + Vercel + Neon + app, qué ejecuta la IA vs qué es secreto. |

## Inicio rápido

```bash
npm install
copy .env.example .env
# Editar .env → DATABASE_URL

npm run db:migrate:deploy
npm run db:seed
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Scripts (raíz)

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Next.js en desarrollo |
| `npm run build` / `start` | Build y producción |
| `npm run lint` | ESLint (`apps/web`) |
| `npm run format` / `format:check` | Prettier |
| `npm run typecheck` | TypeScript |
| `npm run verify` | Lint + typecheck + build (comprobación antes de deploy) |
| GitHub Actions **CI** | En cada push a `main`/`master`: mismo `verify` (sin secretos; ver `.github/workflows/ci.yml`) |
| `npm run db:generate` | Cliente Prisma |
| `npm run db:migrate` | `migrate dev` (nuevas migraciones) |
| `npm run db:migrate:deploy` | Aplicar migraciones (CI / nueva máquina) |
| `npm run db:push` | Sincronizar schema sin migración |
| `npm run db:seed` | Datos demo (`slug=demo`) |
| `npm run db:studio` | Prisma Studio |
| `npm run db:reset` | Reset + migraciones + seed (`--force`) |

## Estructura

```
apps/web/src/app/          # Rutas Next.js
apps/web/src/domains/      # Bounded contexts (placeholders)
packages/db/prisma/        # Schema, migraciones, seed
packages/typescript-config/
docs/
```

## Uso de la base de datos en código

```ts
import { prisma } from "@kite-prospect/db";
```

## Requisitos

- Node.js **20+**
- PostgreSQL **15+**

Acciones que solo un humano puede hacer: [docs/manual-actions-required.md](./docs/manual-actions-required.md).
