# S23 — Dashboard: KPIs mínimos (F1-E16)

## Contexto

`docs/roadmap.md` F1-E16 pide KPIs mínimos: leads nuevos, por etapa comercial, conversaciones abiertas. El dashboard ya mostraba tres conteos totales; faltaba alinear con el funnel y con operación diaria.

## Decisión

1. **Servicio** `getDashboardKpisForAccount` en `domains/analytics/get-dashboard-kpis.ts` (solo lecturas Prisma, paralelizadas).
2. **Métricas:**
   - Contactos totales + **nuevos en ventana fija** (7 días, medianoche local del servidor al calcular `since`).
   - **Conversaciones abiertas** (`status === "active"`) y total de conversaciones como contexto.
   - Propiedades totales + **disponibles** (`status === "available"`) para acoplar a matching.
   - **Tabla** `groupBy commercialStage` en contactos del tenant, orden descendente por volumen.
3. **UI:** `/dashboard` muestra tarjetas actualizadas y tabla de pipeline; sin gráficos ni filtros por fecha (Fase 2).

## Implementado

- Código anterior + esta decisión.
- Documentación de ejecución y estado MVP actualizada.

## Pendiente (Fase 2)

- Rangos de fecha configurables, gráficos, comparativas (`docs/mvp-phase1-status.md` ya listaba gráficos como F2).

## Bloqueado por humano

- Ninguno; interpretación de etapas sigue `docs/product-rules.md` y el modelo `Contact.commercialStage`.
