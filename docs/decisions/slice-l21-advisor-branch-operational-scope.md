# L21 — Alcance operativo por sucursal del asesor (`Advisor.branchId`)

## Contexto

Los asesores pueden tener una sucursal opcional en `Advisor.branchId`. Si está definida, solo deben ver datos operativos de contactos/conversaciones de esa sucursal o sin sucursal (pool compartido).

## Decisión

1. **Fuente de verdad en sesión:** `session.user.advisorBranchId` (callback NextAuth cargando `Advisor.branchId` para `role === "advisor"`).
2. **Helpers Prisma:** `contactWhereForAdvisorRole` y `conversationWhereForAdvisorContact` en `domains/auth-tenancy/advisor-contact-scope.ts`.
3. **Listados y KPIs:** lista de contactos, inbox, ficha y subpáginas, seguimientos activos, dashboard (`getDashboardKpisForAccount` con `session`), reportes operativos (`getOperationalContactWhere` + SQL SLA/cohorte con filtro `Contact` cuando el asesor tiene sucursal).
4. **Server actions** sobre fichas (notas, tareas, perfil declarado, inferencia) validan el contacto con el mismo alcance.
5. **Reportes:** `resolveOperationalBranchFilter` ignora `branchId` en query si un asesor con sucursal pide otra sucursal; la UI de navegación por sucursal solo muestra su sucursal.

## Complemento (API REST)

- **`PATCH /api/contacts/[id]/property-matches/[matchId]`** (rol `advisor`): el contacto del match se resuelve con `contactWhereForAdvisorRole` (misma regla que el panel).
- Otras rutas bajo `/api/contacts/*` siguen restringidas a **admin/coordinador** o a **auth de captura** (Bearer / API key); no requieren alcance asesor adicional en esta iteración.

## Pendiente / F3-E1+ (roadmap)

- Sync u orquestación con **CRM externo** distinto del vínculo `externalId` (L18) sigue como decisión de negocio; ver `docs/roadmap.md` F3-E1.
