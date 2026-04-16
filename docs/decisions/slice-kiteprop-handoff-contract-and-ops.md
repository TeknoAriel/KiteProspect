# Slice: contrato handoff KiteProp + herramientas operativas

## Contexto

Cerrar la integración real Prospect → KiteProp con contrato explícito de HTTP, ACK, dedupe y trazabilidad sin rediseñar el pipeline.

## Decisión

- **ACK** = respuestas **2xx** o **409**; solo entonces `Lead` → `handed_off` y auditoría `lead_handed_off`.
- **422** y 4xx no contemplados como ACK → `UnrecoverableError` (sin reintento BullMQ).
- **5xx / 429 / red** → error reintentable; persistencia de intento con `ok: false`.
- **Replay**: `dispatchIntegrationOutbound(..., { replay: true })` usa `jobId` BullMQ distinto para no chocar con jobs completados.
- **Snapshot**: `HandoffOutboundAttempt.requestPayloadSnapshot` (JSON truncado) para soporte y replay operativo.

## Documentación

- Contrato: `docs/integration-kiteprop-handoff-contract.md`
- Runbook: `docs/kiteprop-integration-runbook.md`

## Pendiente

- Acuerdo formal de cuerpo JSON en 200 con equipo receptor (opcional).
