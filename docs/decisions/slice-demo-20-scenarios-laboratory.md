# Laboratorio: 20 escenarios conversacionales + reporte

## Objetivo

Permitir al tester evaluar el flujo **real** de comprensión (IA + reglas S11) y un **tick aislado** de seguimiento por cuenta, con reporte persistido y vista en el producto.

## Implementación

- **Definición:** `apps/web/src/domains/conversations/simulation/conversation-scenarios.ts` — 20 escenarios, 2 turnos cada uno (consulta razonable + variante límite o absurda).
- **Ejecución:** `POST /api/demo/simulation/run-one` por escenario (evita timeout de un único request largo); el cliente encadena 20 llamadas y luego `POST /api/demo/simulation/save`.
- **Persistencia:** modelo `SimulationRun` (`payload` JSON); migración `20260407130000_add_simulation_run`.
- **UI:** `/dashboard/demo-simulation` (admin/coordinador), detalle `/dashboard/demo-simulation/[id]` con Markdown descargable.
- **Seguimiento:** opción “tick de laboratorio” llama `processDueFollowUps({ asOf, filterAccountId })` tras los escenarios; contacto sintético y plan activo sin `triggers` preferido (`Prisma.DbNull`), fallback a cualquier plan activo.

## Cambios en cron

- `ProcessDueFollowUpsInput`: `asOf` (fecha simulada), `filterAccountId` (aislar laboratorio multi-tenant).

## No objetivo

- No sustituye pruebas de carga ni E2E con Meta/Resend/Twilio.
- Los resultados de IA **varían** entre ejecuciones (temperatura/modelo).
