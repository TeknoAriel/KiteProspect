# Fase 2 (MVP técnico) — cierre por épicas F2-E1…E7

## Alcance

Alineado a `PRODUCT_DEFINITION.md` Fase 2 y `docs/roadmap.md`. No incluye producto enterprise (campañas masivas, analytics profundo).

| Épica | Entrega en código |
|-------|-------------------|
| **F2-E1** | Heurísticas (L4) + refinamiento **opcional** LLM (`SEARCH_PROFILE_INFER_LLM=true`) en `infer-search-profile-llm.ts`; `extra.inferenceMethod` `heuristic_v1` o `heuristic_v1+llm`. |
| **F2-E2** | L5: pesos, feedback, exclusiones (`slice-l5-f2e2-*`). |
| **F2-E3** | Orden de matches: score desc, desempate precio asc, luego `propertyId`; motivo persistido en `reason`. |
| **F2-E4** | `processReactivationForNewProperty` al crear propiedad `available` (API + feed KiteProp); tareas `[Reactivación]`; consentimiento WA/email; fatiga 7 días; match ≥ umbral. |
| **F2-E5** | `FollowUpPlan.triggers`: `minTotalScore`, `commercialStageIn`, `conversationalStageIn`; si falla, cron reprograma +1 h sin ejecutar paso (`evaluate-follow-up-triggers.ts`). |
| **F2-E6** | `GET/POST /api/webhooks/meta-leads`; verificación `META_LEAD_WEBHOOK_VERIFY_TOKEN`; resolución de cuenta por `Integration` `type=meta_lead_ads`, `config.pageId`; canal `meta_lead` en captura. |
| **F2-E7** | Cubierto por L2/L3 (dashboard, reportes, SLA, CSV). |

## Pendiente / Fase 3+

- Firma HMAC de Meta en POST (hoy ingest confía en payload; endurecer en producción).
- UI admin para alta `Integration` Meta (hoy fila en BD o seed).
- Triggers de seguimiento más ricos (objeción, canal, fatiga por intento).

## Referencias

- `docs/roadmap.md` Fase 2.
- `docs/manual-actions-required.md` (Meta + variables opcionales).
