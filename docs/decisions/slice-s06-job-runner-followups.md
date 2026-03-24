# Decisión: job runner para seguimientos (F1-E12 / Sprint S06)

## Contexto

`FollowUpPlan` / `FollowUpSequence` / `FollowUpAttempt` ya están modelados en Prisma. Falta **dónde y cómo** ejecutar pasos de forma fiable sin violar principios del producto (trazabilidad, no spam, multi-tenant).

**Restricción:** la app web corre en **Vercel** (serverless, sin proceso largo). **BullMQ** requiere un **worker Node persistente** y **Redis**; no puede vivir solo dentro del runtime de Next.js.

## Opciones evaluadas

| Opción | Qué es | Pros | Contras |
|--------|--------|------|---------|
| **A. BullMQ + Redis + worker aparte** | Cola en Redis; worker en Railway/Render/Fly | Retries, prioridades, backpressure, estándar de industria | Segundo despliegue, coste Redis, más ops |
| **B. pg-boss / Graphile Worker (cola en Postgres)** | Jobs en tablas en **Neon** | Un solo sistema de datos; sin Redis | Sigue haciendo falta **proceso worker** o invocación periódica |
| **C. Vercel Cron → ruta interna** | `cron` llama `GET/POST /api/cron/...` con secreto | Sin Redis; encaja con hosting actual | Ventanas fijas; lotes pequeños; idempotencia obligatoria |
| **D. Inngest / Trigger.dev / similar** | SaaS de jobs | Menos código de infra | Coste, vendor lock, datos fuera de EU si no se elige región |
| **E. Solo manual / sin automatizar** | No hay jobs | Cero infra | No cumple F1-E12 |

## Decisión (Fase 1 / MVP)

1. **Implementación próxima (S07):** **Opción C ampliada** — **Cron en Vercel** (o invocación equivalente) que ejecuta un **servicio de dominio** en el mismo repo: lee secuencias activas con `nextAttemptAt <= now()`, procesa un **lote acotado**, crea `FollowUpAttempt`, actualiza `FollowUpSequence` y registra auditoría. **PostgreSQL (Neon)** como única fuente de verdad; **sin BullMQ obligatorio** en la primera entrega.

2. **Idempotencia:** cada tick debe ser **seguro ante re-ejecución** (misma ventana temporal): locks por fila (`SELECT … FOR UPDATE SKIP LOCKED` o equivalente en Prisma transaction) o claves de idempotencia por `(sequenceId, step, scheduledWindow)`.

3. **Evolución recomendada (Fase 2 o alto volumen):** migrar el **mismo** servicio de dominio a un **worker** que consuma **BullMQ + Redis** (p. ej. **Upstash Redis**), desacoplado del request HTTP del cron. La lógica de negocio **no** debe vivir solo en handlers HTTP; ya vive en `domains/followups/` (S07).

4. **BullMQ + Redis:** **Opción A** queda como **camino oficial de escalado** cuando haya Redis gestionado y un contenedor/worker desplegado; documentado para no improvisar otra stack.

## Worker “fuera del request”

- **Hoy (MVP):** el “worker” es el **handler del cron** (request acotado, tiempo máximo ~60s en Vercel según plan).
- **Mañana:** proceso **Node largo** en otro servicio que llama a las mismas funciones exportadas desde `domains/followups/`.

## Variables de entorno (S07+)

Ver `.env.example`: `CRON_SECRET`, límites de lote; `REDIS_URL` solo si se activa BullMQ.

## Referencias

- `docs/follow-up-worker-architecture.md` — diagrama y checklist operativo.
- `packages/db/prisma/schema.prisma` — `FollowUpPlan`, `FollowUpSequence`, `FollowUpAttempt`.
- `docs/roadmap.md` — F1-E12.
