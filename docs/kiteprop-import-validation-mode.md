# Modo validación: import KiteProp API + borradores (sin envío automático)

## Variables de entorno (servidor)

| Variable | Descripción |
|----------|-------------|
| `KITEPROP_API_BASE_URL` | Base HTTPS de la API (sin `/` final). Alias aceptado: `KITEPROP_API_URL`. |
| `KITEPROP_API_USER` | Usuario Basic Auth. |
| `KITEPROP_API_PASSWORD` | Contraseña Basic Auth. |
| `KITEPROP_API_KEY` | API key si la exige el gateway (cabecera configurable). |
| `KITEPROP_API_KEY_HEADER` | Nombre de cabecera para la key (default `X-Api-Key`). |
| `KITEPROP_API_IMPORT_PATH` | Path del listado (ej. `/api/v1/leads`). Alias: `KITEPROP_API_LEADS_LIST_PATH`. **Sin path no se llama a la red** (sync falla de forma controlada). |
| `KITEPROP_IMPORT_LOOKBACK_DAYS` | Días hacia atrás (default `7`, máx. 90). |
| `KITEPROP_IMPORT_REVIEW_MODE` | `true` bloquea envío WhatsApp (Meta) y email seguimiento (Resend) **en seguimientos automáticos**. El envío desde la bandeja de validación usa bypass explícito y auditoría. |
| `KITEPROP_IMPORT_ACCOUNT_ID` / `KITEPROP_IMPORT_ACCOUNT_SLUG` | Opcional: cuenta destino para scripts CLI (`npm run kiteprop:import`). |

Query params enviados al GET: `from`, `to`, `from_date`, `to_date` (ISO). Detalle del contrato HTTP: comentario en `kiteprop-rest-adapter.ts`.

## Sync manual (HTTP)

`POST /api/internal/kiteprop-import/run` con `Authorization: Bearer INTERNAL_OPS_SECRET` (o `CRON_SECRET`).

Body opcional: `{ "accountSlug": "demo" }`, `{ "accountId": "..." }`, `{ "lookbackDays": 7 }`. Si se omite cuenta, usa la primera. `lookbackDays` (1–90) sobrescribe `KITEPROP_IMPORT_LOOKBACK_DAYS` para esa corrida.

## Sync por CLI (misma lógica que el POST)

Desde la raíz del monorepo, con `.env` cargado:

- `npm run kiteprop:import:last-week` — últimos 7 días.
- `npm run kiteprop:import -- --days=14` — ventana explícita.
- **`npm run kiteprop:import:fixture-demo`** — sin llamar a la red: lee `apps/web/fixtures/kiteprop-import-sample-response.json` vía `KITEPROP_IMPORT_LIST_FIXTURE` (útil para ver borradores en `/dashboard/validation-inbox` sin credenciales API).

## Revisión de borradores

- Lista: `GET /api/internal/reply-drafts?accountId=&status=`
- Editar / aprobar / descartar / marcar manual: `PATCH /api/internal/reply-drafts/[id]` con JSON `{ "reviewStatus": "approved_to_send" | "discarded" | "manual_review_required", "editedPayload": {...}, "discardedReason": "..." }`

UI: `/dashboard/validation-inbox` (admin/coordinator) — acciones y **Enviar** tras `approved_to_send` (despacho manual auditado). Guía operativa: `docs/kiteprop-operational-validation.md`.

## Métricas

- `GET /api/internal/kiteprop-import/runs`
- `GET /api/internal/kiteprop-import/metrics?hours=168&accountId=` — respuesta incluye `draftsPendingTotal`, `recentSyncRuns`, agregados de sync y `draftsByStatus`.

## Despacho controlado

- **Bandeja**: botón Enviar en `/dashboard/validation-inbox` para borradores `approved_to_send` (WhatsApp o email según `draftKind`). Registra `AuditEvent` `validation_outbound_sent`.
- **Seguimientos automáticos** (cron / matriz): siguen bloqueados mientras `KITEPROP_IMPORT_REVIEW_MODE=true`.
- Para operación “normal” sin bloqueo global, `KITEPROP_IMPORT_REVIEW_MODE=false` y los envíos automáticos vuelven a las rutas existentes.

## Límites conocidos

- El **shape** JSON del listado KiteProp debe alinearse con `normalize-kiteprop-api-item.ts`; si la API difiere, ampliar mapeo sin romper el adapter HTTP.
- **Handoff** Prospect → KiteProp (`lead.qualified` HMAC) es independiente y no se modifica aquí.
- No se inventan propiedades: solo vínculo a `Property` existente por `externalId` + `externalSource`.
