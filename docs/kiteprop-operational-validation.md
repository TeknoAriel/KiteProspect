# Operación controlada: import KiteProp real + bandeja de revisión

## Modo de prueba

1. **Variables** (servidor, ver `.env.example`): `KITEPROP_API_*`, `KITEPROP_IMPORT_LOOKBACK_DAYS`, `KITEPROP_IMPORT_REVIEW_MODE=true` para bloquear envíos automáticos de seguimiento.
2. **Import**: `npm run kiteprop:import:last-week` o `npm run kiteprop:import -- --days=7` con `KITEPROP_IMPORT_ACCOUNT_ID` o `KITEPROP_IMPORT_ACCOUNT_SLUG`.
3. **Bandeja**: `/dashboard/validation-inbox` (admin/coordinator) — aprobar, descartar, marcar revisión manual, editar JSON de `editedPayload`, **Enviar** solo si el estado es `approved_to_send` (WhatsApp o email según `draftKind`).
4. **Observabilidad**: `GET /api/internal/kiteprop-import/metrics?hours=168` (Bearer `INTERNAL_OPS_SECRET`) — incluye `draftsPendingTotal`, `recentSyncRuns`, agregados de sync y conteos por `reviewStatus`.

## Estados de revisión

| Estado | Uso |
|--------|-----|
| `draft_pending_review` | Borrador listo para revisar |
| `manual_review_required` | Falta contexto o canal; revisión humana |
| `approved_to_send` | Listo para despacho manual con botón Enviar |
| `sent` | Enviado (auditoría en `AuditEvent` `validation_outbound_sent`) |
| `discarded` | Descartado |

`imported_real_lead` queda documentado en schema como reservado si en el futuro se separa ingesta y generación de borrador.

## Validación con datos reales (20–30 leads)

Ejecutar import con credenciales reales contra el entorno acordado de KiteProp. Registrar en esta sección:

- **Fecha / entorno / rango de días**
- **Import**: fetched / imported / deduped / errores (ver último `KitepropLeadSyncRun`)
- **Hallazgos**: dedupe, propiedad relacionada, canal, calidad del borrador
- **Bugs encontrados**: (lista; corregir en PRs posteriores sin ampliar alcance)
- **Ajustes mínimos pendientes**: (solo mapeo API / copy / permisos)

*Pendiente de corrida con API productiva hasta tener credenciales y path estable.*

## Límites

- El shape JSON del listado debe alinearse con `normalize-kiteprop-api-item.ts`; cualquier variación se corrige ahí.
- No se inventan propiedades: solo match por `externalId` / fuente; referencia externa en `externalPropertyRef` si no hay match.
