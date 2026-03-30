# L1 — Cierre del backlog priorizado (batch)

**Fecha:** 2026-03-30  
**Contexto:** Sprint largo L1 (`docs/decisions/sprint-l1-long-block.md`).

## Decisión

Se considera **cerrado** el backlog tabular de `docs/execution-plan-sprints.md` (filas 1–5): tests matching/scoring, mutación CRM mínima (nota en ficha), UX WhatsApp con `sentAt`, logs estructurados en sync de matches.

## Implementado (resumen)

- **Matching:** tests de dimensiones (`scorePriceDimension`, `scoreZoneDimension`, `scoreBedroomsDimension`) + casos de referencia existentes.
- **Scoring:** `lead-score-rules.test.ts` sobre funciones puras (`normIntentKeyForLeadScore`, intent/readiness/engagement).
- **CRM ficha:** `addContactNoteAction` + `ContactNotesForm` en `/dashboard/contacts/[id]`; auditoría `contact_note_created`.
- **UX WA:** badge “Ya enviado” y etiqueta “Reenviar por WhatsApp” cuando el match tiene `sentAt`.
- **Trazas:** ya cubierto en `sync-property-matches.ts` (evento JSON sin PII).

## Pendiente (fuera de este cierre)

- Más alcance F1-E13 (p. ej. alta de tarea desde ficha) si se prioriza en un sprint posterior.
- Backlog transversal (`docs/roadmap.md`): observabilidad ampliada, etc.
