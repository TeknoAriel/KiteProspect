# Plan de ejecución: hitos, sprints y tareas (autómata)

**Fuente de alineación:** `PRODUCT_DEFINITION.md`, `docs/roadmap.md`, `docs/status-mvp.md`.

Este documento define **cómo** avanzamos **por etapas** con mínima intervención humana: el **agente** implementa, verifica (`npm run verify`), documenta y empuja cambios; el **humano** solo prueba en URLs, credenciales puntuales y decisiones de negocio no inferibles (ver `docs/manual-actions-required.md`).

---

## Política de responsabilidades

| Quién | Qué hace (siempre) |
|--------|---------------------|
| **Autómata / agente** | Código, migraciones en repo, `npm run verify`, commits/push, `build:vercel` en deploy, decisiones técnicas razonables, `docs/decisions/` cuando aplique. |
| **Humano** | Abrir Vercel/Neon para secretos ya documentados, probar login/demo en producción, aprobar UX si lo pide explícitamente. **No** se le pide ejecutar `db:migrate` en su PC para producción. |

**Errores y flujo:** `docs/agent-workflow-and-errors.md`.

---

## Leyenda de tareas

- `[ ]` pendiente · `[x]` hecho (actualizar al cerrar sprint).
- **Ref roadmap:** ID de `docs/roadmap.md` (ej. F1-E14).
- **Bloqueo 👤:** requiere acción humana (credencial, alta externa); el agente deja checklist y enlaces.

---

## Estado actual del sprint (mantener vivo)

| Campo | Valor |
|--------|--------|
| **Sprint activo** | **S03** — Patrón landing + unificación |
| **Inicio (ISO)** | (rellenar al arrancar) |
| **Objetivo del sprint** | Misma API/eventos que S01/S02; guía copy-paste para landings en `docs/capture-integration.md`. |
| **Última verificación agente** | `npm run verify` en verde antes de merge/push. |

> **Nota para el agente:** al terminar un sprint, marcar tareas `[x]`, actualizar **Sprint activo** a la siguiente fila de la tabla de sprints, y añadir una línea en `docs/decisions/` si hubo decisión técnica relevante.

---

## Hito 0 — Fundación Fase 1 (base ya construida)

**Roadmap:** F1-E1–E4, E8–E11, E13, E16–E17 (en parte).

**Estado:** implementado según `docs/status-mvp.md` y slices 1–9. No re-sprint salvo bugs o deuda acordada.

**Tareas de mantenimiento (continuo):**

- [x] CI + verify en verde.
- [x] Deploy Vercel con `build:vercel` (migraciones + seed + build).
- [ ] Revisar deuda explícita en `docs/mvp-phase1-status.md` solo si entra en un sprint posterior.

---

## Hito 1 — Captura: formularios, widget y landing (F1-E5, E6, E7)

**Objetivo:** mismo modelo de datos (`Contact`, `Conversation`, canal); documentación de integración para sitios del cliente.

| Sprint | Enfoque | Ref | Tareas (agente salvo 👤) |
|--------|---------|-----|---------------------------|
| **S01** | Formulario público estable + hardening | F1-E5 | [x] Revisar `POST /api/contacts/create` y formulario `/lead` vs `docs/capture-integration.md`. [x] Validación central + rate limit por IP (memoria) + `429`/`400` JSON; `docs/decisions/slice-capture-api-hardening.md` actualizado. [x] Checklist manual en `docs/capture-integration.md`. |
| **S02** | Widget embebible (script + origen) | F1-E6 | [x] `kite-lead-widget.js` + `/embed/lead` (iframe, canal `web_widget`); CSP `frame-ancestors *`. [x] Doc y decisión `docs/decisions/slice-s02-widget-embed.md`. |
| **S03** | Patrón landing + unificación | F1-E7 | [ ] Misma API/eventos que S01/S02; guía “copy-paste” para landings. [ ] Sin nuevas entidades fuera de `PRODUCT_DEFINITION.md`. |

**Bloqueos 👤:** ninguno para desarrollo; en producción solo variables ya listadas en checklists de Vercel.

---

## Hito 2 — Matching v0 y recomendación (F1-E14)

**Objetivo:** `PropertyMatch` con reglas simples sobre inventario real; trazabilidad; sin inventar propiedades.

| Sprint | Enfoque | Ref | Tareas |
|--------|---------|-----|--------|
| **S04** | Reglas + persistencia | F1-E14 | [ ] Servicio de matching por cuenta (`accountId`). [ ] Guardar matches y motivo breve (`reason` si existe en modelo). [ ] Tests de reglas o casos en código documentados. |
| **S05** | UI CRM + auditoría | F1-E14 | [ ] Vista en ficha de contacto o sección dedicada. [ ] `recordAuditEvent` en acciones relevantes. |

---

## Hito 3 — Secuencias automáticas (F1-E12)

**Objetivo:** `FollowUpPlan` con ejecución por jobs; `FollowUpAttempt` registrado.

| Sprint | Enfoque | Ref | Tareas |
|--------|---------|-----|--------|
| **S06** | Diseño de job runner | F1-E12 | [ ] Decisión: BullMQ + Redis vs alternativa compatible con hosting (documentar en `docs/decisions/`). [ ] Worker fuera de request o servicio acordado. |
| **S07** | Implementación mínima | F1-E12 | [ ] Encolar pasos; registrar intentos; idempotencia básica. [ ] Pausar/reanudar si el modelo lo permite. |

**Bloqueos 👤:** Redis/hosting si Vercel no admite worker persistente → puede requerir **Neon + servicio worker** (Railway, etc.): el agente documenta; el humano solo crea cuenta si hace falta.

---

## Hito 4 — WhatsApp base (F1-E15)

**Objetivo:** webhook + envío básico; `Consent` y opt-out; estados en `Message`.

| Sprint | Enfoque | Ref | Tareas |
|--------|---------|-----|--------|
| **S08** | Contrato y persistencia | F1-E15 | [ ] Rutas webhook + verificación Meta. [ ] Mapeo a `Conversation` / `Message`. |
| **S09** | Envío y cumplimiento | F1-E15 | [ ] Envío básico; respetar opt-out; logs/auditoría. |

**Bloqueos 👤:** **Meta Business / número / tokens** — checklist en `docs/manual-actions-required.md`; el agente no puede obtener estos secretos.

---

## Hito 5 — Motor conversacional MVP (F1-E9)

**Objetivo:** respuestas asistidas con **salidas estructuradas** + reglas; handoff explícito a humano; sin mutar entidades desde texto libre sin validación.

| Sprint | Enfoque | Ref | Tareas |
|--------|---------|-----|--------|
| **S10** | Orquestación + proveedor | F1-E9 | [ ] Interfaz interna para “siguiente acción” estructurada. [ ] Integración proveedor IA (env). |
| **S11** | Reglas de negocio + handoff | F1-E9 | [ ] Cuándo escalar a humano; registro en auditoría. [ ] Versionado mínimo de prompts/config. |

**Bloqueos 👤:** API key de proveedor de IA en `.env` / Vercel (documentado).

---

## Hito 6 — Entrada Fase 2 (cuando Fase 1 esté cerrada)

Alineado a `docs/roadmap.md` **Fase 2**: F2-E1–E7 por prioridad de negocio. Cada épica se descompone en sprints de **2–4 semanas** con la misma tabla (tareas + 👤).

---

## Orden sugerido de ejecución (cola para el autómata)

1. Completar **S01 → S03** (captura) si el producto prioriza embudos web.
2. En paralelo o después **S04 → S05** (matching) si prioriza conversión sobre captura.
3. **S06 → S07** (jobs) cuando haya claridad de infraestructura.
4. **S08 → S09** (WhatsApp) cuando 👤 tenga Meta listo.
5. **S10 → S11** (IA conversacional) cuando 👤 tenga API de IA.

> El **orden exacto** puede ajustarse si `PRODUCT_DEFINITION.md` o negocio cambian prioridad; este documento debe actualizarse en ese caso.

---

## Definición de fin de sprint (DoD)

- `npm run verify` OK en la rama que se integra.
- Documentación tocada: `docs/status-mvp.md` o decisión en `docs/decisions/` si aplica.
- Lo **bloqueado por 👤** listado explícitamente al cierre del sprint (una viñeta).

---

## Referencias cruzadas

| Documento | Uso |
|-----------|-----|
| `docs/roadmap.md` | IDs de épicas F1-E*. |
| `docs/status-mvp.md` | Qué está implementado hoy. |
| `docs/working-rules.md` | Modo permanente de ingeniería. |
| `docs/manual-actions-required.md` | Acciones solo humanas. |
| `docs/agent-workflow-and-errors.md` | Política de errores. |
