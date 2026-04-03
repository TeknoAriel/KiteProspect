# S33 — Visibilidad operativa (dashboard + inventario filtrable)

## Contexto

Tras cerrar Fase 1 en código, se prioriza **resultado visible en el producto**: el operador debe ver embudo, canales y tendencia sin salir del dashboard, y filtrar inventario sin SQL.

## Decisión

1. **KPIs ampliados** (`getDashboardKpisForAccount`):
   - `channelCounts`: `Conversation.groupBy` por `channel`.
   - `newContactsByDay`: últimos 14 días UTC con agregación SQL `CAST("createdAt" AS date)` + relleno de días en cero.
   - `recentContacts`: últimos 8 contactos con enlace a ficha.
2. **Dashboard `/dashboard`**: título **Operaciones**; paneles con barras horizontales de pipeline, chips de canal con micro-barra, gráfico de barras verticales por día, tabla de recientes.
3. **Propiedades `/dashboard/properties`**: formulario GET con `q`, `status`, `source` (`all` | `manual` | `kiteprop`); URLs compartibles.

## Fuera de alcance

- Librerías de charts (Recharts, etc.): UI con CSS/HTML para mantener dependencias mínimas.
- Reportes exportables / PDF (F2-E7 profundo).

## Referencias

- Roadmap F1-E16, F2-E7 (paso hacia “mejores reportes”).
- `docs/product-rules.md` funnels.
