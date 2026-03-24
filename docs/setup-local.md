# Setup local

Guía para levantar **Kite Prospect** en tu máquina (Windows / macOS / Linux).

El proyecto es un **monorepo npm** (`apps/*`, `packages/*`). Todos los comandos habituales se ejecutan desde la **raíz del repositorio**.

## Requisitos previos

| Herramienta | Versión recomendada | Para qué |
|-------------|---------------------|----------|
| **Node.js** | 20 LTS | Runtime y npm |
| **PostgreSQL** | 15+ | Base de datos |
| **Git** | Cualquier reciente | Control de versiones |

Opcional (Fase 1 avanzada / jobs):

| Herramienta | Para qué |
|-------------|----------|
| **Redis** | Colas BullMQ (cuando esté cableado) |

---

## 1. Entrar al repo

```bash
cd "ruta/al/proyecto/Kite Prospect"
```

---

## 2. Instalar dependencias

Desde la raíz:

```bash
npm install
```

Esto instala workspaces (`@kite-prospect/web`, `@kite-prospect/db`, `@kite-prospect/tsconfig`) y ejecuta `postinstall` → `db:generate` (cliente Prisma).

**Si venías de la estructura antigua (sin `apps/`):** borra `node_modules` y `package-lock.json` en la raíz y vuelve a ejecutar `npm install` (ver `docs/manual-actions-required.md`).

---

## 3. Variables de entorno

1. En la **raíz** del monorepo, copia el ejemplo:

   ```bash
   copy .env.example .env
   ```

   En macOS/Linux: `cp .env.example .env`.

2. Edita `.env` y define al menos:

   ```env
   DATABASE_URL="postgresql://USUARIO:PASSWORD@localhost:5432/kite_prospect?schema=public"
   ```

Los scripts `db:*` usan **dotenv-cli** y leen `.env` desde la raíz. Next.js también carga el `.env` de la raíz vía `apps/web/next.config.mjs`.

Para probar **captura desde formularios** (`POST /api/contacts/create`), define también `CAPTURE_API_SECRET` (ver `.env.example` y `docs/decisions/slice-capture-api-hardening.md`). Opcional: `ENABLE_PUBLIC_LEAD_FORM=true` para habilitar **`/lead`**. Guía completa: **`docs/capture-integration.md`**.

Para **IA conversacional** (`POST /api/ai/conversation/next-action`): `OPENAI_API_KEY` y opcional `OPENAI_MODEL` (ver `docs/decisions/slice-s10-conversational-ai.md` y **`docs/configuracion-manual-paso-a-paso.md`**).

**Acción manual:** si no tienes PostgreSQL, sigue `docs/manual-actions-required.md`.

---

## 4. Crear la base de datos

En `psql` o en la consola del proveedor:

```sql
CREATE DATABASE kite_prospect;
```

---

## 5. Migraciones y seed

**Primera vez (BD vacía):** aplicar migraciones versionadas del repo:

```bash
npm run db:migrate:deploy
```

**Datos de ejemplo (opcional):**

```bash
npm run db:seed
```

El seed es **idempotente**: si ya existe una cuenta con `slug=demo`, no inserta nada de nuevo.

**Desarrollo (nuevas migraciones con nombre):**

```bash
npm run db:migrate
```

(Equivale a `prisma migrate dev` en el paquete `@kite-prospect/db`.)

**Sincronizar schema sin historial (solo prototipos):**

```bash
npm run db:push
```

**Reinicio brusco (borra datos y vuelve a migrar + seed):**

```bash
npm run db:reset
```

**Explorar tablas:**

```bash
npm run db:studio
```

---

## 6. Calidad de código

| Comando | Descripción |
|---------|-------------|
| `npm run lint` | ESLint en la app Next (`apps/web`) |
| `npm run format` | Prettier (todo el repo) |
| `npm run format:check` | Comprueba formato sin escribir |
| `npm run typecheck` | TypeScript (`web` + `db`) |

---

## 7. Ejecutar la app

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

---

## Estructura relevante

| Ruta | Contenido |
|------|-----------|
| `apps/web/` | Next.js 14 (App Router) |
| `packages/db/` | Prisma: `prisma/schema.prisma`, migraciones, seed |
| `packages/typescript-config/` | `tsconfig` compartidos |

Importar la base de datos en código:

```ts
import { prisma } from "@kite-prospect/db";
```

---

## Problemas frecuentes

### Can't reach database server

- PostgreSQL en marcha y `DATABASE_URL` correcta.

### dotenv: no such file `.env`

- Crea `.env` en la **raíz** (no solo dentro de `apps/web`).

### Puerto 3000 ocupado

- `cd apps/web && npx next dev -p 3001` o cierra el proceso que usa el puerto.

### Errores tras cambiar workspaces

- `rm -rf node_modules package-lock.json && npm install` (en la raíz).

---

## Documentación relacionada

- [architecture.md](./architecture.md) — Monorepo y capas.
- [manual-actions-required.md](./manual-actions-required.md) — Pasos que requieren humano.
