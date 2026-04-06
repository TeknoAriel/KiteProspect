# Diferencias: definición oficial del core vs implementación

Auditoría actualizada tras alinear **matriz de seguimiento**, **intensidades**, **metadata por intento** y **campos de secuencia**.

## Implementado en esta iteración

| Tema | Detalle |
|------|---------|
| Matriz oficial 4×6 (intensidades × etapas por paso) | `follow-up-official-matrix.ts`: Suave 4, Normal 6, Fuerte 8, Prioritario 10 filas con `objectiveEs`, `dataToObtainEs`, `nextActionHintEs`, `coreStageKey`. |
| Intensidad en planes | UI y guardado con `soft` / `normal` / `strong` / `priority`; legacy `low` / `medium` / `high` → normalización al guardar y en runtime. |
| Secuencia con etapa núcleo | `FollowUpSequence.matrixCoreStageKey` actualizado al avanzar pasos; al iniciar secuencia se fija la etapa del paso 0. |
| Rama en secuencia | `FollowUpSequence.matrixBranchKey` inferida en **cron** v1 (`infer-follow-up-matrix-branch.ts`); intentos con `metadata.branchInferred`. |
| Intento enriquecido | `FollowUpAttempt.metadata.matrix`: intensidad, índice, etapa, datos a obtener, pista siguiente acción. Si el JSON del plan no trae `objective`, el cron usa el texto de la matriz. |
| Reglas sugeridas de intensidad por rama | `suggestNextIntensityAfterBranch()` (producto; **no** persiste cambio de plan automáticamente). |
| Tests | Vitest: longitud de matrices = defaults de intentos; normalización y reglas de rama. |
| Seed demo | 8 planes (2 por intensidad) con pasos alineados a textos de matriz (`seed-demo-showcase.ts`). |
| UI | Ficha contacto: intensidad legible, etapa núcleo, rama si existe; listados de planes con intensidad normalizada. |

## Otras alineaciones recientes (producto técnico)

| Tema | Detalle |
|------|---------|
| Meta Lead Ads POST | Si `META_LEAD_WEBHOOK_APP_SECRET` está definido, se valida `X-Hub-Signature-256`; sin él el webhook POST sigue sin exigir firma (desarrollo). |
| Integraciones en UI | `/dashboard/account/integrations` lista `Integration` del tenant sin exponer secretos (`slice-l9-meta-lead-signature-integrations-ui.md`). |
| Meta pageId desde app | Admin puede crear/editar `meta_lead_ads` + `pageId` y `paused` sin SQL (`slice-l10-integration-meta-lead-ads-crud.md`). |
| OpenAPI captura | `GET /openapi-capture-v1.yaml` documenta `POST /api/contacts/create` (`slice-l11-openapi-public-capture.md`). |
| API keys captura (F3-E2) | Claves `kp_…` por cuenta + auth en ruta pública (`slice-f3e2-capture-api-keys-tenant.md`). |
| Rama matriz fijada | `matrixBranchLocked` en secuencia; UI y `PATCH` en ficha; cron respeta (`slice-l12-matrix-branch-manual-lock.md`). |

## Parcial / siguiente nivel

| Definición | Estado |
|------------|--------|
| Secuencia no ciega según **solo** intentos | **v1:** `advancePastSkippableSteps` omite pasos cuando el perfil cubre la etapa (`follow-up-matrix-step-skip.ts`); `FOLLOW_UP_MATRIX_SKIP_ENABLED=false` lo desactiva. Falta: afinar reglas por tenant y mensajes libres. |
| Motor de ramas completo | Cron infiere rama v1 incl. `no_response` por último outbound antiguo. **L12:** si `matrixBranchLocked`, el cron no sobrescribe la rama; falta: refinamiento por canal. |
| Aplicar `suggestNextIntensityAfterBranch` | **L13:** hint en ficha si la sugerencia difiere del plan (no persiste). Política automática (nueva secuencia / flag) sigue pendiente. |
| Orden de canales (origen → histórico → consentimiento) | Parcial; consentimiento sí; histórico sin métrica. |
| Perfil comportamental completo | Eventos de clic/vista: parcial (`PropertyMatch`, `Recommendation`). |

## Sin cambio de alcance

- **Propieya:** mismo mecanismo de feed que documentación de integración; sin conector de marca dedicado en repo.
- **Gating por plan comercial:** tipos listos; enforcement no global.
- **Un solo campo `operationalStage` en Contact:** sigue siendo vista calculada + dos columnas técnicas.

## Referencias

- `docs/seguimiento-y-cualificacion.md`
- `docs/decisions/core-prospeccion-alineacion-nucleo.md`
- `docs/core-prospeccion.md`
