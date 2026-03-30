# Sprint L1 — Modo bloque largo (sin micro-cierres)

## Contexto

Los slices Sxx funcionan bien para trazabilidad, pero frenar cada pocos cambios interrumpe el flujo del autómata y del deploy. Se define un **sprint largo** con entregas agrupadas.

## Decisión

1. **Nombre:** Sprint **L1** (long-run), orientado a **cerrar huecos de F1-E13 (CRM mínimo)** y **reforzar matching/scoring** sin convertir el producto en CRM enterprise.
2. **Duración orientativa:** 10–14 días corridos (ajustable en `execution-plan-sprints.md`).
3. **Ritmo de código:**
   - El agente puede trabajar **varios días seguidos** en la misma línea temática.
   - **No** es obligatorio un commit por cada micro-tarea: se prefieren **commits lógicos** (p. ej. “feat: notas API”, “test: matching dimensiones”) con `npm run verify` verde antes de cada push.
4. **Documentación:** al **cerrar** L1 (o al hito intermedio semanal si hay bloqueo), actualizar `docs/execution-plan-sprints.md`, `docs/status-mvp.md` si cambió alcance, y añadir `docs/decisions/` solo si hay decisión técnica nueva.
5. **Fuera de L1:** features nuevas fuera de `PRODUCT_DEFINITION.md` siguen requiriendo actualizar ese archivo primero.

## Implementado / estado

- Definición y backlog vivo: `docs/execution-plan-sprints.md` (sección Sprint largo L1).

## Pendiente

- Ejecutar el backlog L1 hasta marcar cierre en el plan.

## Bloqueado por humano

- Pruebas en URL pública y credenciales ya documentadas en `docs/manual-actions-required.md`.
