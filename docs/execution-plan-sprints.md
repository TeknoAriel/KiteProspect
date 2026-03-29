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
| **Sprint activo** | **Post-S21** — centro de configuración visible + planes de seguimiento editables; siguiente prioridad según `docs/roadmap.md`. |
| **Inicio (ISO)** | — |
| **Objetivo del sprint** | S21: hub admin (módulos, env, endpoints, IA, seguimientos) + UI edición `FollowUpPlan`; ver `slice-s21-settings-hub-followup-plans.md`. |
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

## Hito 0b — Configuración de tenant (F1-E2, MVP parcial)

**Objetivo:** pantalla que centralice lectura de cuenta y enlaces a valores en `Account.config` (sin CRUD completo de entidad todavía).

| Sprint | Enfoque | Ref | Tareas |
|--------|---------|-----|--------|
| **S13** | Hub cuenta + navegación | F1-E2 | [x] `/dashboard/account` (admin): datos tenant + enlace a IA; doc `slice-s13-account-settings-hub.md`. |
| **S17** | Ajustes generales | F1-E2 | [x] `/dashboard/account/general` + `GET/PATCH /api/account/general-config`; edición de `Account.name` y `Account.config.timezone`; auditoría; `slice-s17-account-general-config.md`. |
| **S21** | Centro configuración + planes seguimiento | F1-E2, F1-E12 | [x] `/dashboard/account` ampliado (módulos, env, endpoints, IA, enlaces); `/dashboard/account/follow-up-plans` edición JSON validada; `slice-s21-settings-hub-followup-plans.md`. |

**Bloqueos 👤:** ninguno.

---

## Hito 0c — Inventario propiedades (F1-E4)

**Objetivo:** ABM de `Property` en el tenant con estados y validación; base para matching sin datos inventados.

| Sprint | Enfoque | Ref | Tareas |
|--------|---------|-----|--------|
| **S14** | API + UI inventario | F1-E4 | [x] `GET/POST /api/properties`, `GET/PATCH/DELETE /api/properties/[id]`; `/dashboard/properties` (+ new, edit); roles mutación admin/coordinator; auditoría; `slice-s14-properties-abm.md`. |

**Bloqueos 👤:** ninguno.

---

## Hito 0d — Usuarios y asesores (F1-E3, parcial usuario)

**Objetivo:** ABM de `User` por tenant con hash de contraseña, roles y estados.

| Sprint | Enfoque | Ref | Tareas |
|--------|---------|-----|--------|
| **S15** | API + UI usuarios | F1-E3 | [x] `GET/POST /api/users`, `GET/PATCH/DELETE /api/users/[id]`; `/dashboard/users` (+ new, edit); hash bcrypt y no exponer password; auditoría; `slice-s15-users-abm.md`. |

**Bloqueos 👤:** ninguno.

---

## Hito 0e — Asesores (F1-E3)

**Objetivo:** ABM de `Advisor` por tenant; vínculo opcional a `User` con regla de unicidad.

| Sprint | Enfoque | Ref | Tareas |
|--------|---------|-----|--------|
| **S16** | API + UI asesores | F1-E3 | [x] `GET/POST /api/advisors`, `GET/PATCH/DELETE /api/advisors/[id]`; `/dashboard/advisors` (+ new, edit); validación `userId` + unicidad; auditoría; `slice-s16-advisors-abm.md`. |

**Bloqueos 👤:** ninguno.

---

## Hito 1 — Captura: formularios, widget y landing (F1-E5, E6, E7)

**Objetivo:** mismo modelo de datos (`Contact`, `Conversation`, canal); documentación de integración para sitios del cliente.

| Sprint | Enfoque | Ref | Tareas (agente salvo 👤) |
|--------|---------|-----|---------------------------|
| **S01** | Formulario público estable + hardening | F1-E5 | [x] Revisar `POST /api/contacts/create` y formulario `/lead` vs `docs/capture-integration.md`. [x] Validación central + rate limit por IP (memoria) + `429`/`400` JSON; `docs/decisions/slice-capture-api-hardening.md` actualizado. [x] Checklist manual en `docs/capture-integration.md`. |
| **S02** | Widget embebible (script + origen) | F1-E6 | [x] `kite-lead-widget.js` + `/embed/lead` (iframe, canal `web_widget`); CSP `frame-ancestors *`. [x] Doc y decisión `docs/decisions/slice-s02-widget-embed.md`. |
| **S03** | Patrón landing + unificación | F1-E7 | [x] Tabla de decisión + sección §4 en `docs/capture-integration.md`; ejemplos en `docs/examples/`; decisión `slice-s03-landing-unification.md`. [x] Sin nuevas entidades. |

**Bloqueos 👤:** ninguno para desarrollo; en producción solo variables ya listadas en checklists de Vercel.

---

## Hito 2 — Matching v0 y recomendación (F1-E14)

**Objetivo:** `PropertyMatch` con reglas simples sobre inventario real; trazabilidad; sin inventar propiedades.

| Sprint | Enfoque | Ref | Tareas |
|--------|---------|-----|--------|
| **S04** | Reglas + persistencia | F1-E14 | [x] Servicio `score-property-match` + `sync-property-matches` (solo `available`, umbral 30). [x] `reason` persistido. [x] `MATCHING_SCORE_CASES` + decisión `slice-s04-matching-v0.md`. |
| **S05** | UI CRM + auditoría | F1-E14 | [x] Ficha contacto: lista + botón recalcular + motivo. [x] Auditoría `property_matches_synced`. |
| **S20** | Envío recomendación WhatsApp | F1-E14 | [x] Botón por match en ficha contacto; `Recommendation` + `sentAt`; roles admin/coordinator; `slice-s20-property-recommendation-whatsapp.md`. |

---

## Hito 3 — Secuencias automáticas (F1-E12)

**Objetivo:** `FollowUpPlan` con ejecución por jobs; `FollowUpAttempt` registrado.

| Sprint | Enfoque | Ref | Tareas |
|--------|---------|-----|--------|
| **S06** | Diseño de job runner | F1-E12 | [x] Decisión: **Cron Vercel + Postgres (MVP)**; BullMQ+Redis como escalado documentado. `slice-s06-job-runner-followups.md` + `docs/follow-up-worker-architecture.md`. [x] Contrato tipos `follow-up-job-contract.ts`. |
| **S07** | Implementación mínima | F1-E12 | [x] `processDueFollowUps` + `/api/cron/follow-up-due` + `vercel.json` cron; `FollowUpAttempt` + auditoría; seed con secuencia. [ ] Pausar/reanudar UI: Fase 2. |

**Bloqueos 👤:** Redis/hosting si Vercel no admite worker persistente → puede requerir **Neon + servicio worker** (Railway, etc.): el agente documenta; el humano solo crea cuenta si hace falta.

---

## Hito 4 — WhatsApp base (F1-E15)

**Objetivo:** webhook + envío básico; `Consent` y opt-out; estados en `Message`.

| Sprint | Enfoque | Ref | Tareas |
|--------|---------|-----|--------|
| **S08** | Contrato y persistencia | F1-E15 | [x] `GET / POST /api/webhooks/whatsapp` + firma opcional; `WHATSAPP_ACCOUNT_SLUG`; ingest a Contact/Conversation/Message; opt-out; statuses; `slice-s08-whatsapp-webhook.md`. |
| **S09** | Envío y cumplimiento | F1-E15 | [x] `sendWhatsAppTextToContact` + `POST /api/whatsapp/send` (admin); opt-out; auditoría; `slice-s09-whatsapp-outbound.md`. |

**Bloqueos 👤:** **Meta Business / número / tokens** — checklist en `docs/manual-actions-required.md`; el agente no puede obtener estos secretos.

---

## Hito 5 — Motor conversacional MVP (F1-E9)

**Objetivo:** respuestas asistidas con **salidas estructuradas** + reglas; handoff explícito a humano; sin mutar entidades desde texto libre sin validación.

| Sprint | Enfoque | Ref | Tareas |
|--------|---------|-----|--------|
| **S10** | Orquestación + proveedor | F1-E9 | [x] `NextConversationAction` + `planNextConversationAction` + OpenAI (`OPENAI_API_KEY`); `POST /api/ai/conversation/next-action`; `slice-s10-conversational-ai.md`. |
| **S11** | Reglas de negocio + handoff | F1-E9 | [x] Reglas post-modelo + handoff forzado; auditoría `ai_next_action_planned` / `ai_handoff_rules_applied`. [x] Versionado mínimo en código + env (`AI_CONVERSATION_PROMPT_VERSION`). Ver `slice-s11-conversational-handoff-rules.md`. |
| **S12** | Inbox hilo + IA + envío borrador WA + prompt por cuenta | F1-E8, F1-E9 | [x] `/dashboard/inbox/[id]` + panel IA; envío manual WhatsApp (admin/coordinator); `Account.config` + `/dashboard/account/ai-prompt` + API; ver `slice-s12-inbox-ai-assist.md`. |
| **S18** | Inbox lista con filtros | F1-E8 | [x] `/dashboard/inbox` con filtros por `channel` y `status`; estado visible en tarjeta; ver `slice-s18-inbox-filters.md`. |
| **S19** | Inbox búsqueda + paginación | F1-E8 | [x] `q` (contacto o mensajes), `page` / `pageSize` (10, 20 o 50), enlaces y formulario coherentes con S18; ver `slice-s19-inbox-search-pagination.md`. |

**Bloqueos 👤:** API key de proveedor de IA en `.env` / Vercel (documentado); Meta para envío real por WhatsApp.

---

## Hito 6 — Entrada Fase 2 (cuando Fase 1 esté cerrada)

Alineado a `docs/roadmap.md` **Fase 2**: F2-E1–E7 por prioridad de negocio. Cada épica se descompone en sprints de **2–4 semanas** con la misma tabla (tareas + 👤).

---

## Orden sugerido de ejecución (cola para el autómata)

1. Completar **S01 → S03** (captura) si el producto prioriza embudos web.
2. En paralelo o después **S04 → S05** (matching) si prioriza conversión sobre captura.
3. **S06 → S07** (jobs) cuando haya claridad de infraestructura.
4. **S08 → S09** (WhatsApp) cuando 👤 tenga Meta listo.
5. **S10 → S11 → S12** (IA conversacional + inbox operativo) cuando 👤 tenga API de IA (y Meta si se usa WA desde inbox).

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
