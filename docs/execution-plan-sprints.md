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
| **Sprint activo** | **F3-E1+ CRM profundo** (sync con producto CRM concreto; ver `docs/roadmap.md` F3-E1 — **L22** cerró resolve + webhook; ver `slice-l22-f3e1-crm-bridge-resolve-webhook.md`). |
| **Último sprint largo cerrado** | **L28** F3-E1+ `GET …/external` (`slice-l28-f3e1-external-get-capture.md`); antes **L27** (`slice-l27-f3e1-external-id-unique.md`). |
| **Última verificación agente** | Post L28: `npm run verify` OK. |

> **Nota para el agente:** al terminar un sprint **corto** (Sxx), marcar tareas `[x]` y actualizar esta tabla. En **L1**, preferir **commits por bloque lógico** (varios días seguidos OK); no detenerse a cada línea si el batch mantiene verify verde. Decisión de modo largo: `docs/decisions/sprint-l1-long-block.md`.

---

## Sprint largo L1 — Backlog priorizado (trabajo continuo)

**Reglas:** alcance acotado (no CRM enterprise). Orden sugerido; el agente puede reordenar si una tarea desbloquea otra.

| # | Área | Ref roadmap | Entregable (ejemplo) | Estado |
|---|------|-------------|----------------------|--------|
| 1 | Matching | F1-E14 | Más tests Vitest (dimensiones sueltas: precio, zona, dormitorios) + mantener `MATCHING_SCORE_CASES` al día | [x] |
| 2 | Scoring | F1-E11 | Tests o funciones puras extraídas para `intent/readiness/engagement` (sin depender de Prisma donde sea posible) | [x] |
| 3 | CRM ficha | F1-E13 | Una mutación mínima: alta de **nota** o **tarea** desde `/dashboard/contacts/[id]` + API scoped por tenant + auditoría | [x] |
| 4 | Matching UX | F1-E14 | Ficha: indicador claro de propiedad ya enviada por WA (`sentAt`) / evitar reenvío accidental | [x] |
| 5 | Trazas | — | Logs estructurados en sync de matches (accountId, contactId, counts) sin PII | [x] |

**Cierre L1:** filas 1–5 `[x]`; tabla y `docs/status-mvp.md` actualizados; sprint activo rotado (ver arriba). Detalle: `docs/decisions/slice-l1-batch-completion.md`.

---

## Sprint largo L2 — Visibilidad en producto (S33–S34)

| # | Área | Ref roadmap | Entregable | Estado |
|---|------|-------------|------------|--------|
| 1 | Dashboard | F1-E16, F2-E7 (paso) | Embudo en barras, canales, tendencia 14 días UTC, últimos contactos | [x] |
| 2 | Inventario UI | F1-E4 | Filtros GET en `/dashboard/properties` (texto, estado, origen manual vs feed) | [x] |
| 3 | Reportes | F2-E7 (paso) | `/dashboard/reportes`: nuevos 7d por canal (1.er hilo), embudo conversacional, tareas pendientes, secuencias activas | [x] |
| 4 | CRM lista | F1-E13 | Badge de canal (primera conversación) en tarjetas de `/dashboard/contacts` | [x] |

**Cierre L2 (S33–S34):** verify verde; decisiones `slice-s33-*`, `slice-s34-*`; `docs/status-mvp.md` actualizado.

---

## Sprint largo L3 — Reportes F2-E7 (SLA + comercial + CSV)

**Objetivo:** completar un paso sólido de **F2-E7** sin analytics enterprise.

| # | Área | Ref roadmap | Entregable | Estado |
|---|------|-------------|------------|--------|
| 1 | SLA inbox | F2-E7 | Mediana/promedio minutos primera respuesta (primer outbound tras primer inbound), ventana alineada a 7 días UTC | [x] |
| 2 | Embudo comercial | F2-E7 | `commercialStage` en `/dashboard/reportes` (groupBy contactos) | [x] |
| 3 | Export | F2-E7 | `GET /api/exports/operational-reports` → CSV UTF-8 (BOM) | [x] |
| 4 | Tests | — | Vitest `mean` / `median` en `stats-median.ts` | [x] |

**Cierre L3:** verify verde; `docs/decisions/slice-l3-f2e7-sla-export-commercial-funnel.md`; `docs/status-mvp.md` actualizado.

---

## Sprint largo L4 — F2-E1 (inferred profile, paso heurístico)

| # | Área | Ref roadmap | Entregable | Estado |
|---|------|-------------|------------|--------|
| 1 | Reglas | F2-E1 | Heurísticas sobre mensajes inbound → campos + `confidence` | [x] |
| 2 | Persistencia | F2-E1 | `SearchProfile` `source=inferred`; `refreshConversationalStage` con preferencia declarado | [x] |
| 3 | Matching / score | F2-E1 | `selectPreferredSearchProfile` en sync matches y `calculateLeadScore` | [x] |
| 4 | CRM perfil | F2-E1 | Botón inferir + UI; auditoría; hint en `plan-next` si solo inferido | [x] |
| 5 | Tests | — | Preferencia + heurísticas | [x] |

**Cierre L4:** verify verde; `docs/decisions/slice-l4-f2e1-inferred-profile-heuristics.md`; `docs/status-mvp.md` actualizado.

---

## Sprint largo L5 — F2-E2 (matching: pesos + feedback + exclusiones)

| # | Área | Ref roadmap | Entregable | Estado |
|---|------|-------------|------------|--------|
| 1 | Pesos | F2-E2 | `Account.config.matchingWeights` normalizado; `GET/PATCH /api/account/matching-config`; UI `/dashboard/account/matching` | [x] |
| 2 | Motor | F2-E2 | `scorePropertyAgainstProfile` con pesos; sync v1 + exclusiones `extra.excludedPropertyIds`; preservar `not_interested` | [x] |
| 3 | CRM | F2-E2 | Feedback en ficha; campo exclusiones en perfil declarado; auditoría | [x] |

**Cierre L5:** verify verde; `docs/decisions/slice-l5-f2e2-matching-weights-feedback-exclusions.md`; `docs/status-mvp.md` actualizado.

---

## Sprint largo L6 — Cierre Fase 2 (F2-E1…E6 + refuerzos; F2-E7 ya en L3)

| # | Épica | Entregable | Estado |
|---|--------|------------|--------|
| 1 | F2-E3 | Desempate de matches (precio asc, id estable); `reason` persistido | [x] |
| 2 | F2-E4 | Reactivación al crear propiedad + feed; tareas; consentimiento + fatiga | [x] |
| 3 | F2-E5 | `triggers` en cron seguimientos; reprograma +1 h si no cumple | [x] |
| 4 | F2-E1 | LLM opcional `SEARCH_PROFILE_INFER_LLM` + `infer-search-profile-llm.ts` | [x] |
| 5 | F2-E6 | `/api/webhooks/meta-leads`; canal `meta_lead`; parse leadgen | [x] |
| 6 | F2-E7 | Ya cubierto por L2/L3 | [x] |

**Cierre L6:** verify verde; `docs/decisions/slice-f2-mvp-completion.md`; `docs/status-mvp.md`; `docs/manual-actions-required.md` §6b.

---

## Sprint largo L7 — Ramas de matriz (inferencia v1 + UI)

| # | Área | Entregable | Estado |
|---|------|------------|--------|
| 1 | Core | `inferFollowUpMatrixBranch` + umbrales; `matrixBranchKey` + `metadata.branchInferred` en cron | [x] |
| 2 | CRM ficha | Etiquetas ES de rama; “Dato a obtener” por intento | [x] |
| 3 | Docs | `slice-l7-matrix-branch-infer-cron.md`; `diferencias-vs-implementacion-actual.md` | [x] |

**Última verificación agente:** actualizar tabla “Estado actual del sprint” al cerrar L7.

---

## Sprint largo L8 — Salto de pasos (perfil vs matriz)

| # | Área | Entregable | Estado |
|---|------|------------|--------|
| 1 | Core | `follow-up-matrix-step-skip.ts`; cron avanza `currentStep` sin intentos intermedios | [x] |
| 2 | Ops | Auditoría `follow_up_matrix_steps_skipped`; env `FOLLOW_UP_MATRIX_SKIP_ENABLED` | [x] |
| 3 | Docs | `slice-l8-matrix-step-skip.md` | [x] |

---

## Sprint largo L9 — Meta Lead Ads (firma POST) + integraciones en cuenta

| # | Área | Entregable | Estado |
|---|------|------------|--------|
| 1 | Seguridad | `META_LEAD_WEBHOOK_APP_SECRET` opcional; validación `X-Hub-Signature-256` en `POST /api/webhooks/meta-leads` | [x] |
| 2 | UI | `/dashboard/account/integrations` (admin, solo lectura); hub cuenta enlazado | [x] |
| 3 | Tests + docs | Vitest HMAC; `.env.example`; `manual-actions-required` §6b; esta decisión | [x] |

**Cierre L9:** verify verde; `docs/decisions/slice-l9-meta-lead-signature-integrations-ui.md`.

---

## Sprint largo L10 — Meta Lead Ads (CRUD pageId en cuenta)

| # | Área | Entregable | Estado |
|---|------|------------|--------|
| 1 | API | `POST /api/account/integrations/meta-lead-ads`; `PATCH /api/account/integrations/[id]`; unicidad pageId entre activas | [x] |
| 2 | UI | Formularios en `/dashboard/account/integrations` (editar + añadir) | [x] |
| 3 | Dominio + tests | `normalizeMetaLeadPageId` + Vitest; auditoría | [x] |

**Cierre L10:** verify verde; `docs/decisions/slice-l10-integration-meta-lead-ads-crud.md`.

---

## Sprint largo L11 — OpenAPI 3.0 captura pública (F3-E2 paso)

| # | Área | Entregable | Estado |
|---|------|------------|--------|
| 1 | Spec | `public/openapi-capture-v1.yaml` — `POST /api/contacts/create` | [x] |
| 2 | Docs | Enlace en `capture-integration.md`; decisión L11 | [x] |
| 3 | Producto | Hub cuenta / módulos referencian URL del spec; Vitest archivo presente | [x] |

**Cierre L11:** verify verde; `docs/decisions/slice-l11-openapi-public-capture.md`.

---

## Sprint largo L12 — Rama matriz manual (cron no pisa)

| # | Área | Entregable | Estado |
|---|------|------------|--------|
| 1 | Modelo | `FollowUpSequence.matrixBranchLocked` + migración | [x] |
| 2 | Cron | `resolveMatrixBranchForCron` + metadata intento manual vs inferido | [x] |
| 3 | API + UI | `PATCH` rama; ficha contacto guardar/fijar / automático | [x] |
| 4 | Docs | `slice-l12-matrix-branch-manual-lock.md` | [x] |

**Cierre L12:** verify verde; decisión anterior.

---

## Sprint largo L13 — Hint intensidad sugerida (ficha contacto)

| # | Área | Entregable | Estado |
|---|------|------------|--------|
| 1 | UI | `FollowUpIntensitySuggestion` según `suggestNextIntensityAfterBranch` + rama + plan | [x] |
| 2 | Docs | `slice-l13-intensity-suggestion-ui.md` | [x] |

**Cierre L13:** verify verde; decisión anterior.

---

## Sprint F3-E2 — API keys captura por tenant

| # | Área | Entregable | Estado |
|---|------|------------|--------|
| 1 | Modelo | `CaptureApiKey` + migración | [x] |
| 2 | API pública | `POST /api/contacts/create` acepta global o `kp_…` por cuenta | [x] |
| 3 | Admin | `GET/POST /api/account/capture-api-keys`, `DELETE …/[id]`; UI cuenta | [x] |
| 4 | Docs | OpenAPI + `capture-integration.md`; `slice-f3e2-capture-api-keys-tenant.md` | [x] |

**Cierre F3-E2:** verify verde; decisión anterior.

---

## Sprint largo L14 — F3-E3 Webhooks públicos (MVP)

**Objetivo (PRODUCT_DEFINITION Fase 3, `docs/roadmap.md` F3-E3):** que cada tenant pueda registrar **URLs de destino** y recibir **eventos firmados** sobre hechos del producto (p. ej. lead/contacto creado por captura, cambio de asignación), sin sustituir a **F3-E1** (CRM externo / sync profundo).

**Alcance MVP (acotado):** suscripción por cuenta (`WebhookSubscription`), payload JSON estable, firma HMAC, `fetch` con timeout 8s (sin cola de reintentos en MVP).

| # | Área | Ref roadmap | Entregable | Estado |
|---|------|-------------|------------|--------|
| 1 | Diseño | F3-E3 | Decisión `docs/decisions/slice-l14-f3e3-public-webhooks.md` | [x] |
| 2 | Persistencia | F3-E3 | Modelo Prisma + migración; API admin; UI `/dashboard/account/webhooks` | [x] |
| 3 | Emisión | F3-E3 | `lead.captured`, `contact.assignment_changed`; POST firmado; no bloquea captura/asignación | [x] |
| 4 | Docs + producto | F3-E3 | `docs/status-mvp.md`, `docs/product-rules.md` | [x] |

**Cierre L14:** verify verde; decisión anterior.

**Bloqueos 👤:** ninguno para desarrollo; el destino del webhook es infra del cliente.

---

## Sprint largo L15 — F3-E4 Multi-sucursal (MVP)

**Objetivo:** `Branch` por cuenta, `Contact.branchId`, CRM y captura con `branchSlug`; sin permisos por rol ni reporting por sucursal (backlog).

| # | Área | Ref roadmap | Entregable | Estado |
|---|------|-------------|------------|--------|
| 1 | Modelo | F3-E4 | `Branch` + `Contact.branchId` + migración | [x] |
| 2 | API | F3-E4 | `GET/POST/PATCH /api/account/branches`; `PATCH /api/contacts/[id]` con `branchId` | [x] |
| 3 | Producto | F3-E4 | UI sucursales; ficha + lista contactos; OpenAPI/captura `branchSlug` | [x] |
| 4 | Docs | F3-E4 | `slice-l15-f3e4-multi-branch-mvp.md`; `product-rules`, `capture-integration` | [x] |

**Cierre L15:** verify verde; decisión anterior.

---

## Sprint largo L16 — F3-E5 SMS en seguimientos (Twilio)

**Objetivo:** canal `"sms"` en pasos de `FollowUpPlan` con envío vía Twilio cuando el entorno está configurado.

| # | Área | Ref roadmap | Entregable | Estado |
|---|------|-------------|------------|--------|
| 1 | Integración | F3-E5 | `sendFollowUpSmsToContact` + consent `sms` + variables Twilio | [x] |
| 2 | Cron | F3-E5 | `processDueFollowUps` rama `sms` (sent / manual / failed) | [x] |
| 3 | Ops | F3-E5 | `/api/health` `followUpSmsTwilio`; hub env; `.env.example` | [x] |
| 4 | Docs | F3-E5 | `slice-l16-f3e5-sms-twilio-follow-up.md`; actualizar `slice-follow-up-channels-email-manual.md` | [x] |

**Cierre L16:** verify verde; decisión anterior.

---

## Sprint largo L17 — F3-E6 Reporting (cohorte + ventana)

**Objetivo:** paso acotado de reporting avanzado sin BI infinito: cohorte de altas por ventanas de 7 días y selector de período 7/14/30 días.

| # | Área | Ref roadmap | Entregable | Estado |
|---|------|-------------|------------|--------|
| 1 | Agregados | F3-E6 | Cohorte 4×7 días UTC + `Promise.all` counts | [x] |
| 2 | UI | F3-E6 | `/dashboard/reportes?days=7\|14\|30` + tabla cohorte | [x] |
| 3 | Export | F3-E6 | CSV `cohorte_7d` + `?days=` en export | [x] |
| 4 | Docs | F3-E6 | `slice-l17-f3e6-operational-cohort-weeks.md` | [x] |

**Cierre L17:** verify verde; decisión anterior.

---

## Sprint largo L18 — F3-E1 CRM externo (vínculo ID)

**Objetivo:** correlación `Contact.externalId` sin integrar un CRM concreto.

| # | Área | Ref roadmap | Entregable | Estado |
|---|------|-------------|------------|--------|
| 1 | Dominio | F3-E1 | `normalizeContactExternalId` + tests | [x] |
| 2 | API | F3-E1 | `PATCH /api/contacts/[id]/external` + auditoría | [x] |
| 3 | UI | F3-E1 | Ficha CRM externo + OpenAPI v1.1.0 | [x] |
| 4 | Docs | F3-E1 | `slice-l18-f3e1-crm-external-id-connector.md` | [x] |

**Cierre L18:** verify verde; sync profundo pendiente negocio.

---

## Sprint largo L19 — F3-E4+ Reportes por sucursal

**Objetivo:** filtro `branchId` en agregados operativos y CSV (sin permisos por rol ni `Property.branchId`).

| # | Área | Ref roadmap | Entregable | Estado |
|---|------|-------------|------------|--------|
| 1 | Agregados | F3-E4+ | `getOperationalReportsForAccount` + SLA SQL con `Contact` | [x] |
| 2 | UI | F3-E4+ | `/dashboard/reportes?branchId=` + enlaces por sucursal | [x] |
| 3 | Export | F3-E4+ | CSV + filename por slug | [x] |
| 4 | Docs | F3-E4+ | `slice-l19-f3e4-operational-reports-by-branch.md` | [x] |

**Cierre L19:** verify verde; permisos por sucursal / inventario por sucursal quedan backlog.

---

## Sprint largo L20 — F3-E5+ SMS segundo proveedor (Telnyx)

**Objetivo:** alternativa a Twilio para el mismo canal `sms` en planes JSON, sin duplicar consentimiento ni cron.

| # | Área | Ref roadmap | Entregable | Estado |
|---|------|-------------|------------|--------|
| 1 | Core | F3-E5+ | `SMS_PROVIDER` + `sendSmsViaTelnyxHttp` + refactor Twilio | [x] |
| 2 | Ops | F3-E5+ | `/api/health` `followUpSmsProvider`, `followUpSmsConfigured`, Telnyx | [x] |
| 3 | Docs | F3-E5+ | `slice-l20-f3e5-sms-telnyx-provider.md`; `.env.example`; `manual-actions` | [x] |
| 4 | Tests | — | Vitest Telnyx mock + `sms-provider-config` | [x] |

**Cierre L20:** verify verde; push / otros canales quedan backlog.

---

## Sprint largo L21 — F3-E4++ Alcance operativo por sucursal (asesor)

**Objetivo:** `Advisor.branchId` opcional; sesión `advisorBranchId`; filtros Prisma en contactos/conversaciones; dashboard, reportes, followups y acciones de ficha alineados.

| # | Área | Ref | Entregable | Estado |
|---|------|-----|------------|--------|
| 1 | Modelo + API | F3-E4++ | `Advisor.branchId`, migración, POST/PATCH asesores, sesión | [x] |
| 2 | Producto | F3-E4++ | Formulario asesor + listado; alcance en contactos/inbox/KPIs/reportes | [x] |
| 3 | Tests | — | Vitest `advisor-contact-scope` + `getOperationalContactWhere` | [x] |
| 4 | Docs | — | `slice-l21-advisor-branch-operational-scope.md` | [x] |

**Cierre L21:** `npm run verify` OK.

---

## Sprint largo L23 — Alta producción (observabilidad / endurecimiento)

**Objetivo:** `docs/roadmap.md` backlog transversal (observabilidad + runbooks) sin alcance enterprise.

| # | Área | Ref | Entregable | Estado |
|---|------|-----|------------|--------|
| 1 | HTTP | — | Cabeceras seguridad en `next.config.mjs`; `X-Frame-Options` solo dashboard | [x] |
| 2 | Auth | — | Rate limit POST `/api/auth/*` por IP (`AUTH_RATE_LIMIT_*`); middleware | [x] |
| 3 | Ops | S31 | `/api/health`: `deploy.vercelEnv`, `deploymentId`, `demoAdvisorUser` + issue seed | [x] |
| 4 | Tests | — | Vitest `allowRateLimitWithConfig` | [x] |
| 5 | Docs | — | `slice-l23-production-hardening.md`; `.env.example` | [x] |

**Cierre L23:** `npm run verify` OK.

---

## Sprint largo L24 — F3-E3 Ampliación webhooks (etapas + secuencia follow-up)

**Objetivo:** extender `WEBHOOK_EVENT_TYPES` y emisión firmada sin cambiar el contrato L14 (HMAC, `emitAccountWebhooks`).

| # | Área | Ref | Entregable | Estado |
|---|------|-----|------------|--------|
| 1 | Tipos + default BD | F3-E3 | `contact.stages_updated`, `follow_up.sequence_started`; migración default `WebhookSubscription.events` | [x] |
| 2 | Emisión | F3-E3 | PATCH `/api/contacts/[id]` (cambio real de etapas); `startFollowUpSequenceForContact` | [x] |
| 3 | UI | F3-E3 | Copy `/dashboard/account/webhooks`; checkboxes desde `WEBHOOK_EVENT_TYPES` | [x] |
| 4 | Docs | — | `slice-l24-f3e3-webhooks-stages-followup.md`; `product-rules`, `status-mvp` | [x] |

**Cierre L24:** `npm run verify` OK.

---

## Sprint largo L25 — Alta producción II (HSTS, robots, security.txt)

**Objetivo:** refuerzo transversal sin dependencias de negocio; alinea `docs/roadmap.md` backlog observabilidad.

| # | Área | Ref | Entregable | Estado |
|---|------|-----|------------|--------|
| 1 | HTTP | — | `Strict-Transport-Security` si `VERCEL=1`; `poweredByHeader: false` | [x] |
| 2 | SEO/crawlers | — | `src/app/robots.ts` → disallow `/dashboard/`, `/api/` | [x] |
| 3 | Divulgación | — | `public/.well-known/security.txt` | [x] |
| 4 | Docs | — | `slice-l25-production-hardening-ii.md` | [x] |

**Cierre L25:** `npm run verify` OK.

---

## Sprint largo L26 — Alta producción III (health operativo)

| # | Área | Ref | Entregable | Estado |
|---|------|-----|------------|--------|
| 1 | Ops | S31 | `GET /api/health`: cabeceras no-cache | [x] |
| 2 | Ops | — | Payload `runtime` + `security` (sin PII) | [x] |
| 3 | Tests | — | Vitest `robots.test.ts` | [x] |
| 4 | Docs | — | `slice-l26-production-hardening-iii.md` | [x] |

**Cierre L26:** `npm run verify` OK.

---

## Sprint largo L22 — F3-E1+ Puente CRM (resolve + webhook `external_id`)

**Objetivo:** orquestación mínima CRM ↔ Kite sin integrar un proveedor concreto; extiende L18 y F3-E3.

| # | Área | Ref | Entregable | Estado |
|---|------|-----|------------|--------|
| 1 | API | F3-E1+ | `GET /api/contacts/resolve-external` (captura auth) | [x] |
| 2 | Webhooks | F3-E3 | evento `contact.external_id_updated`; migración default `events` | [x] |
| 3 | Emisión | — | `PATCH …/external` (sesión + captura) | [x] |
| 4 | Docs | — | OpenAPI 1.2.0, `product-rules`, `capture-integration`, decisión | [x] |

**Cierre L22:** `npm run verify` OK.

---

## Sprint largo L27 — F3-E1+ Integridad `externalId` (único por cuenta)

| # | Área | Ref | Entregable | Estado |
|---|------|-----|------------|--------|
| 1 | Modelo | F3-E1+ | `@@unique([accountId, externalId])` + migración | [x] |
| 2 | API | — | `PATCH …/external` → **409** + `conflictContactId` / `P2002` | [x] |
| 3 | OpenAPI | — | v1.2.1, `ExternalIdConflictBody` | [x] |
| 4 | Docs | — | `slice-l27-f3e1-external-id-unique.md`, `capture-integration` | [x] |

**Cierre L27:** `npm run verify` OK.

---

## Sprint largo L28 — F3-E1+ Lectura vínculo CRM por `contactId`

| # | Área | Ref | Entregable | Estado |
|---|------|-----|------------|--------|
| 1 | API | F3-E1+ | `GET /api/contacts/{id}/external` (sesión + captura) | [x] |
| 2 | Ops | — | `contact_external_read` en structured log | [x] |
| 3 | OpenAPI | — | v1.2.2, `getContactExternal` | [x] |
| 4 | Docs | — | `slice-l28-f3e1-external-get-capture.md`, `capture-integration` | [x] |

**Cierre L28:** `npm run verify` OK.

---

## Backlog Fase 3 — F3-E1+ (sync profundo), F3-E4++, F3-E5++

Orden negociable; cada uno abre un **sprint largo** con tabla de tareas al arrancar.

| Sprint | Ref roadmap | Tema | Entregable (orientativo) |
|--------|-------------|------|---------------------------|
| **L22b** | F3-E1+ | Sync / API producto | Integraciones según `PRODUCT_DEFINITION` (sin comprometer CRM enterprise) |
| **F3-E5++** | F3-E5+ | Más canales | Push web, otro proveedor, etc. |

**Cerrados en Fase 3:** F3-E2, F3-E3 (L14 + **L24** ampliación eventos), F3-E4 MVP (L15), F3-E5 paso SMS Twilio (L16), F3-E6 paso cohorte/export (L17), **F3-E1 slice vínculo ID (L18)**, **F3-E4+ reportes por sucursal (L19)**, **F3-E5+ SMS Telnyx opcional (L20)**, **F3-E4++ permisos sucursal asesor (L21)**. **Transversal L23** alta producción (cabeceras, health extendido, rate limit auth). **L25–L26** HSTS/robots/security.txt/health. **L22** F3-E1+ resolve + webhook `contact.external_id_updated`. **L27** unicidad `(accountId, externalId)`.

---

## Hito 0 — Fundación Fase 1 (base ya construida)

**Roadmap:** F1-E1–E4, E8–E11, E13, E16–E17 (en parte).

**Estado:** implementado según `docs/status-mvp.md` y slices 1–9. No re-sprint salvo bugs o deuda acordada.

**Tareas de mantenimiento (continuo):**

- [x] CI + verify en verde.
- [x] Deploy Vercel con `build:vercel` (migraciones + seed + build).
- [x] Revisar deuda explícita en `docs/mvp-phase1-status.md` (S31: alineado a cierre F1 código + ops 👤).

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
| **S22** | Ingesta KiteProp (feeds) | F1-E4 | [x] `Account.config.kitepropFeed`; parsers OpenNavent XML + JSON flexible; `syncKitepropFeedForAccount` (fingerprint, withdrawn/delete si falta en snapshot); `GET/PATCH /api/account/kiteprop-feed-config`, `POST /api/account/kiteprop-feed-sync`; `GET /api/cron/kiteprop-property-feed` + Vercel cron (`0 2 */2 * *` ≈ cada 2 días en prueba; ajustable); `slice-s22-kiteprop-property-feed.md`, `slice-s32-kiteprop-incremental-json-cron.md`. |

**Bloqueos 👤:** URLs de feed reales las pega el admin en la UI (HTTPS en producción).

---

## Hito 0f — Dashboard operativo (F1-E16, refuerzo)

**Objetivo:** números accionables además de totales globales.

| Sprint | Enfoque | Ref | Tareas |
|--------|---------|-----|--------|
| **S23** | KPIs por tenant | F1-E16 | [x] `getDashboardKpisForAccount`; `/dashboard` con nuevos (7 días), conversaciones abiertas, propiedades disponibles, tabla por `commercialStage`; `slice-s23-dashboard-kpis.md`. |
| **S24** | Matching/score hardening | F1-E11, F1-E14 | [x] Vitest + tests `score-property-match`; `calculateFitScore` promedio top-3; intent/readiness extendidos; texto deploy en dashboard; `slice-s24-matching-tests-scoring-fit.md`. |

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
| **S07** | Implementación mínima | F1-E12 | [x] `processDueFollowUps` + `/api/cron/follow-up-due` + `vercel.json` cron; `FollowUpAttempt` + auditoría; seed con secuencia. [x] Pausar/reanudar desde ficha contacto + API (`slice-crm-contacts-filters-assignment-followup-pause.md`). |
| **S30** | Iniciar seguimiento desde ficha | F1-E12 | [x] `POST /api/contacts/[id]/follow-up-sequences`; `startFollowUpSequenceForContact`; UI selector + intentos; `slice-s30-follow-up-start-from-contact.md`. |
| **S31** | Salud despliegue + checklist prod | F1 (cierre ops) | [x] `GET /api/health` ampliado (`integrations`, `AUTH_URL` si deploy); `slice-s31-production-readiness-health.md`; checklist y status MVP actualizados. |

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
| **S25** | Inbox rango fechas + etapas contacto + logs | F1-E8, F1-E13 | [x] `from`/`to` (UTC) sobre `Conversation.updatedAt`; `PATCH /api/contacts/[id]` etapas; `structured-log` en matching, follow-up batch, captura API; `slice-s25-inbox-dates-stages-structured-log.md`. |
| **S26** | Perfil declarado editable | F1-E10 | [x] Formulario en `/dashboard/contacts/[id]/profile`; `upsertDeclaredSearchProfile` + `Contact.declaredProfile`; auditoría; `slice-s26-declared-search-profile-ui.md`. |
| **S27** | Edición tareas/notas + logs CRM | F1-E13 | [x] Editar notas/tareas, completar/cancelar; `Note.updatedAt`; `logStructured` CRM/contacto; `slice-s27-crm-edit-observability.md`. |
| **S28** | Tareas cerradas en ficha + log captura | F1-E13 | [x] Historial tareas `completed`/`cancelled`; `lead_captured` post-captura; `slice-s28-crm-closed-tasks-capture-log.md`. |
| **S29** | Inbox leído / no leído | F1-E8 | [x] `Conversation.lastReadAt`; marca al abrir hilo (cliente); lista con badge no leído; `slice-s29-inbox-read-state.md`. |

**Bloqueos 👤:** API key de proveedor de IA en `.env` / Vercel (documentado); Meta para envío real por WhatsApp.

---

## Hito 6 — Entrada Fase 2 (cuando Fase 1 esté cerrada)

Alineado a `docs/roadmap.md` **Fase 2**: F2-E1–E7 por prioridad de negocio. Cada épica se descompone en sprints de **2–4 semanas** con la misma tabla (tareas + 👤).

---

## Orden sugerido de ejecución (cola para el autómata)

**Cola actual (post L28):**

1. **L22b / F3-E1+** sync profundo con CRM o capa intermedia — ver **Backlog Fase 3**; **F3-E5++** push u otros canales.
2. Histórico: L22 resolve/webhook, L27 unicidad, L28 GET vínculo.

**Histórico (ya cerrado en repo):**

- S01–S03 captura, S04–S05 matching, S06–S07 jobs, S08–S09 WhatsApp, S10+ inbox/IA según secciones de hitos anteriores.

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
| `docs/decisions/sprint-l1-long-block.md` | Modo sprint largo L1 (bloque continuo). |
| `docs/manual-actions-required.md` | Acciones solo humanas. |
| `docs/agent-workflow-and-errors.md` | Política de errores. |
| `docs/decisions/github-ssh-windows-dev.md` | SSH GitHub en Windows (clave dedicada + `~/.ssh/config`); checklist humano en `manual-actions-required.md` (ítem 13). |
| `docs/decisions/slice-s26-declared-search-profile-ui.md` | F1-E10: edición `SearchProfile` declarado + espejo `Contact.declaredProfile`. |
| `docs/decisions/slice-s27-crm-edit-observability.md` | F1-E13: edición tareas/notas; logs `crm_*`, `contact_*` sin PII. |
| `docs/decisions/slice-s28-crm-closed-tasks-capture-log.md` | F1-E13: historial tareas cerradas; log `lead_captured` post-captura. |
| `docs/decisions/slice-s29-inbox-read-state.md` | F1-E8: `lastReadAt` + indicador no leído en inbox. |
| `docs/decisions/slice-s30-follow-up-start-from-contact.md` | F1-E12: iniciar secuencia desde ficha + intentos visibles. |
| `docs/decisions/slice-s31-production-readiness-health.md` | Cierre ops F1: health público + integraciones configuradas (booleanos). |
| `docs/decisions/slice-s32-kiteprop-incremental-json-cron.md` | Feed KiteProp: 304, manifiesto id+fecha, withdraw/delete, cron ajustable (~2 días en prueba). |
| `docs/decisions/slice-s33-dashboard-ops-visibility.md` | Dashboard operaciones + filtros listado propiedades. |
| `docs/decisions/slice-s34-reports-and-contact-channel-badge.md` | `/dashboard/reportes` + badge canal en contactos. |
| `docs/decisions/slice-l3-f2e7-sla-export-commercial-funnel.md` | SLA primera respuesta, embudo comercial, CSV reportes. |
| `docs/decisions/slice-l4-f2e1-inferred-profile-heuristics.md` | Perfil inferido heurístico + prioridad declarado. |
| `docs/decisions/slice-l5-f2e2-matching-weights-feedback-exclusions.md` | F2-E2: pesos matching, feedback, exclusiones. |
| `docs/decisions/slice-f2-mvp-completion.md` | Cierre Fase 2 (F2-E1…E7 MVP técnico). |
| `docs/decisions/vercel-deploy-lag-behind-github.md` | Si Vercel no despliega el mismo commit que GitHub `main`. |
| `docs/decisions/git-dual-remote-tekno-kiteprop.md` | Tekno (`origin`) diario; `kiteprop` copia bajo demanda. |
| `docs/decisions/kiteprop-frontera-demo-y-produccion.md` | No usar producción KiteProp como default; demos Vercel; doble aprobación. |
| `docs/decisions/vercel-404-diagnostico.md` | Checklist si la URL de Vercel devuelve 404. |
| `docs/demo-simulated-inquiries-avalon-metro-level-innova.md` | Demo narrativo: 5 consultas × líneas comerciales, 15 días simulados (sin ejecución). |
| `docs/decisions/slice-l14-f3e3-public-webhooks.md` | F3-E3 webhooks salientes firmados. |
| `docs/decisions/slice-l15-f3e4-multi-branch-mvp.md` | F3-E4 multi-sucursal MVP (`Branch`, `Contact.branchId`). |
| `docs/decisions/slice-l16-f3e5-sms-twilio-follow-up.md` | F3-E5 SMS seguimiento (Twilio). |
| `docs/decisions/slice-demo-channel-simulation-ui.md` | Demo por canal (hilos simulados, `/dashboard/demo-channels`). |
| `docs/decisions/slice-demo-20-scenarios-laboratory.md` | Laboratorio 20 escenarios + `SimulationRun` (`/dashboard/demo-simulation`). |
| `docs/decisions/slice-l17-f3e6-operational-cohort-weeks.md` | F3-E6 cohorte 7d + ventana 7/14/30 en reportes. |
| `docs/decisions/slice-l18-f3e1-crm-external-id-connector.md` | F3-E1 slice: `Contact.externalId` + PATCH + ficha. |
| `docs/decisions/slice-l19-f3e4-operational-reports-by-branch.md` | F3-E4+ reportes operativos filtrados por sucursal. |
| `docs/decisions/slice-l20-f3e5-sms-telnyx-provider.md` | F3-E5+ SMS Telnyx opcional (`SMS_PROVIDER`). |
| `docs/decisions/slice-l21-advisor-branch-operational-scope.md` | F3-E4++ alcance operativo asesor por `Advisor.branchId`. |
| `docs/decisions/slice-l23-production-hardening.md` | L23: cabeceras seguridad, rate limit POST auth, health extendido. |
| `docs/decisions/slice-l24-f3e3-webhooks-stages-followup.md` | L24: webhooks `contact.stages_updated`, `follow_up.sequence_started`. |
| `docs/decisions/slice-l25-production-hardening-ii.md` | L25: HSTS Vercel, `poweredByHeader: false`, `robots.txt`, `security.txt`. |
| `docs/decisions/slice-l26-production-hardening-iii.md` | L26: `/api/health` no-cache + payload `runtime`/`security`. |
| `docs/decisions/slice-l22-f3e1-crm-bridge-resolve-webhook.md` | L22: `GET …/resolve-external` + webhook `contact.external_id_updated`. |
| `docs/decisions/slice-l27-f3e1-external-id-unique.md` | L27: índice único `externalId` por cuenta; PATCH 409. |
| `docs/decisions/slice-l28-f3e1-external-get-capture.md` | L28: `GET …/external` lectura vínculo + etapas. |
