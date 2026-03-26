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
| [docs/deploy-automation-one-time-setup.md](./docs/deploy-automation-one-time-setup.md) | Configuración única Vercel+Git para deploys automáticos en cada push. |
| [docs/produccion-checklist-usuario.md](./docs/produccion-checklist-usuario.md) | **Solo tú en producción:** URLs a abrir, variables del hosting, ejemplos. |
| [docs/paso-a-paso-sin-programar.md](./docs/paso-a-paso-sin-programar.md) | **Implementar sin programar:** Neon, Vercel, variables, enlaces y login demo. |
| [docs/accesos-y-configuracion-git-neon-vercel.md](./docs/accesos-y-configuracion-git-neon-vercel.md) | **GitHub, Neon, Vercel:** URLs y ajustes exactos del proyecto. |
| [docs/flujo-completo-pantalla-a-pantalla.md](./docs/flujo-completo-pantalla-a-pantalla.md) | **Flujo alineado:** repos + Vercel + Neon + app, qué ejecuta la IA vs qué es secreto. |
| [docs/agent-workflow-and-errors.md](./docs/agent-workflow-and-errors.md) | **Agente vs humano**, política de errores (P1001, login, build). |
| [docs/execution-plan-sprints.md](./docs/execution-plan-sprints.md) | **Hitos, sprints y cola de trabajo** alineados al masterplan (autómata). |
| [docs/capture-integration.md](./docs/capture-integration.md) | **Captura de leads:** formulario `/lead`, widget, API, landings. |
| [docs/examples/README.md](./docs/examples/README.md) | **Ejemplos copy-paste** (HTML estático, proxy serverless). |
| [docs/follow-up-worker-architecture.md](./docs/follow-up-worker-architecture.md) | **Seguimientos:** cron vs worker (BullMQ) y checklist. |
| [docs/decisions/slice-s07-follow-up-cron.md](./docs/decisions/slice-s07-follow-up-cron.md) | Cron `/api/cron/follow-up-due` y variables. |
| [docs/decisions/slice-s08-whatsapp-webhook.md](./docs/decisions/slice-s08-whatsapp-webhook.md) | Webhook WhatsApp (Meta) y variables. |
| [docs/decisions/slice-s09-whatsapp-outbound.md](./docs/decisions/slice-s09-whatsapp-outbound.md) | Envío saliente WhatsApp (Graph API) y `POST /api/whatsapp/send`. |
| [docs/decisions/slice-s10-conversational-ai.md](./docs/decisions/slice-s10-conversational-ai.md) | Motor conversacional: siguiente acción estructurada + proveedor dual (Gemini/OpenAI). |
| [docs/decisions/slice-s11-conversational-handoff-rules.md](./docs/decisions/slice-s11-conversational-handoff-rules.md) | Reglas de handoff post-modelo, auditoría y versión de prompt (`AI_CONVERSATION_PROMPT_VERSION`). |
| [docs/decisions/slice-s12-inbox-ai-assist.md](./docs/decisions/slice-s12-inbox-ai-assist.md) | Hilo de inbox, asistencia IA, envío manual borrador WhatsApp, overrides en `Account.config`. |
| [docs/decisions/slice-s13-account-settings-hub.md](./docs/decisions/slice-s13-account-settings-hub.md) | Hub de configuración de cuenta (F1-E2 parcial). |
| [docs/configuracion-manual-paso-a-paso.md](./docs/configuracion-manual-paso-a-paso.md) | **Solo humano:** URLs y valores a configurar (Neon, Vercel, OpenAI, Meta, secretos). |
| [docs/configuracion-paso-a-paso-humano.md](./docs/configuracion-paso-a-paso-humano.md) | **Versión simple** (pasos 1–7, qué clicar y qué pegar). |

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
| `npm run test:ai` | Prueba local del motor conversacional (requiere `GEMINI_API_KEY` u `OPENAI_API_KEY` en `.env`) |
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
