# L19 — F3-E4+ Reportes operativos por sucursal

**Fecha:** 2026-04-07  
**Contexto:** `slice-l15-f3e4-multi-branch-mvp.md` dejó **reporting por sucursal** en backlog. Sin permisos por rol en este slice (no `Advisor.branchId` ni restricción de lista CRM).

## Decisión

1. **Filtro opcional `branchId`** en reportes operativos y CSV: query `?branchId=<id>` junto a `?days=`; solo sucursales **activas** de la cuenta; ID inválido se ignora (equivalente a “todas”).
2. **Agregados** (`getOperationalReportsForAccount`): todos los conteos y groupBy de `Contact` usan `contactWhereOperational(accountId, branchId)`; cohorte 4×7d y SLA (SQL raw) filtran vía `JOIN` `Contact` y `co."branchId"` cuando aplica.
3. **UI** `/dashboard/reportes`: enlaces “Todas” + una entrada por sucursal activa; export CSV con mismos parámetros; nombre de archivo incluye slug de sucursal o `todas`.
4. **Fuera de alcance:** inventario por sucursal (`Property.branchId`); restricción de acceso por rol a una sucursal.

## Referencias

- `apps/web/src/domains/analytics/get-operational-reports.ts`
- `apps/web/src/domains/analytics/operational-reports-branch.ts`
- `apps/web/src/app/dashboard/reportes/page.tsx`
