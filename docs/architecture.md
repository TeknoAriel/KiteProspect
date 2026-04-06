# Arquitectura del repositorio

## 1. Auditoría del estado actual (bootstrap técnico)

| Área | Estado |
|------|--------|
| **Fuente de producto** | `PRODUCT_DEFINITION.md` presente y completo. |
| **Monorepo** | npm workspaces: `apps/web`, `packages/db`, `packages/tsconfig`. |
| **App web** | Next.js 14 en `apps/web` (App Router), página inicial mínima. |
| **Persistencia** | Prisma en `packages/db/prisma/`; migración inicial + seed demo. |
| **Dominios** | Placeholders en `apps/web/src/domains/*` (sin lógica de negocio aún). |
| **Tooling** | ESLint (Next), Prettier, TypeScript compartido, `dotenv-cli` para `db:*`. |
| **Auth** | No implementada (pendiente Fase 1). |
| **Redis / BullMQ** | No cableado (previsto para jobs). |
| **Integraciones** | No implementadas (diseño solo en modelo `Integration`). |

**Conclusión:** Base lista para desarrollo serio: monorepo ordenado, migraciones versionadas, scripts unificados desde la raíz.

---

## 2. Visión general

```
                    ┌─────────────────────────────────────┐
                    │           Clientes externos          │
                    │  (widget web, landing, WhatsApp)     │
                    └─────────────────┬───────────────────┘
                                      │
                    ┌─────────────────▼───────────────────┐
                    │         Next.js (App Router)          │
                    │  UI interna + Route Handlers / API     │
                    └─────────────────┬───────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          │                           │                           │
          ▼                           ▼                           ▼
   ┌─────────────┐           ┌─────────────────┐         ┌─────────────┐
   │  Dominios   │           │  Prisma / PG    │         │ Redis+BullMQ │
   │  (servicios)│◄─────────►│  (verdad)       │         │ (jobs async) │
   └─────────────┘           └─────────────────┘         └─────────────┘
          │
          ▼
   ┌─────────────┐
   │ IA provider │  (solo vía ai-orchestration, outputs estructurados)
   └─────────────┘
```

- **Un solo deployable** en Fase 1: monolito modular Next.js (simplifica MVP).
- **Multi-tenant:** todo acceso a datos filtrado por `accountId` (ver sección 6).

---

## 3. Estructura concreta del repo (monorepo)

```
Kite Prospect/
├── apps/
│   └── web/                       # @kite-prospect/web — Next.js App Router
│       ├── public/
│       └── src/
│           ├── app/               # Rutas UI + route handlers (API)
│           └── domains/           # Bounded contexts (lógica futura)
├── packages/
│   ├── db/                        # @kite-prospect/db — Prisma, migraciones, seed
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       └── migrations/
│   └── typescript-config/         # @kite-prospect/tsconfig — bases TS compartidas
├── docs/
├── PRODUCT_DEFINITION.md          # Source of truth de alcance
├── package.json
└── README.md
```

**Notas:**

- Los dominios viven en `apps/web/src/domains/` (bounded contexts); el paquete `@kite-prospect/db` solo expone Prisma.
- `capture/` y `scoring/` están como carpetas placeholder según el mapa de módulos del producto.
- El **widget embebible** puede ser un bundle en `apps/web/public/` o paquete separado más adelante.

---

## 4. Módulos vs dominios (mapa)

| Módulo obligatorio (producto) | Dominio(s) principal(es) |
|------------------------------|---------------------------|
| Tenant / cuentas / configuración | `auth-tenancy` + datos `Account` |
| Captura omnicanal | `capture`, `integrations` (webhooks) |
| Inbox unificado | `conversations` |
| Motor conversacional | `conversations` + `ai-orchestration` |
| Perfilado dinámico | `crm-leads` (`SearchProfile`, perfil del `Contact`) |
| Matching y recomendación | `matching` + `properties` |
| Seguimiento inteligente | `followups` |
| Scoring y priorización | `scoring` (o `crm-leads`) |
| CRM básico nativo | `crm-leads` |
| Integraciones | `integrations` |
| Analítica | `analytics` |
| Auditoría | Transversal: servicio `audit` en `lib/` o `domains/crm-leads` que escriba `AuditEvent` |

**Núcleo de prospección (constantes y etiquetas):** dominio `apps/web/src/domains/core-prospeccion/` — alineado con `docs/core-prospeccion.md`, `docs/seguimiento-y-cualificacion.md`, `docs/estados-y-etiquetas.md`. **Límites y planes (preparación monetización):** `auth-tenancy/account-plan-capabilities.ts` y `docs/monetizacion-base.md`.

---

## 5. Capas dentro de cada dominio (patrón recomendado)

Por dominio, cuando crezca el código:

```
domains/<nombre>/
├── index.ts           # API pública del módulo
├── services/          # Casos de uso
├── repositories/      # Acceso Prisma acotado (opcional si el servicio usa prisma directo al inicio)
├── policies/          # Reglas puras (sin IO)
└── types.ts           # DTOs internos
```

- **Policies:** reglas que no llaman red ni BD (testeables).
- **Services:** orquestan Prisma, colas y llamadas a IA.

---

## 6. Multi-tenancy y seguridad

- **Clave de aislamiento:** `accountId` en todas las entidades de negocio (ya reflejado en Prisma para la mayoría).
- **Usuario interno:** siempre asociado a un `Account`; las consultas deben incluir `where: { accountId }` desde el contexto de sesión, nunca desde el cliente sin validar.
- **APIs públicas** (widget, formulario, WhatsApp): autenticación por **token de cuenta** o **firma de webhook**, con rate limiting (futuro).
- **Auditoría:** acciones sensibles crean `AuditEvent` (quién, qué entidad, acción, diff resumido).

---

## 7. Datos y migraciones

- **Schema y migraciones:** `packages/db/prisma/` (comando raíz: `npm run db:migrate`, `db:migrate:deploy`, `db:push`).
- **Equipo / CI / prod:** preferir `db:migrate:deploy` con historial en Git.

---

## 8. Jobs asíncronos (diseño)

| Job (ejemplo) | Cuándo |
|---------------|--------|
| Enviar paso de `FollowUpSequence` | Programado por BullMQ según `nextAttemptAt` |
| Re-scoring de contacto | Tras mensaje nuevo o cambio de perfil |
| Reactivación por nueva propiedad | Fase 2; al crear `Property` compatible |
| Sincronización CRM externo | Fase 3 |

**Infra:** Redis + BullMQ en el mismo proceso Node o worker separado (decisión de despliegue posterior).

---

## 9. IA

- Único punto de entrada: `ai-orchestration`.
- Contrato: entrada contextual + **schema de salida** (Zod / JSON Schema).
- Actualización de entidades: solo campos validados; rechazar o marcar “sugerencia” si no pasa reglas.

---

## 10. Documentos relacionados

- [domain-model.md](./domain-model.md) — Entidades y relaciones.
- [product-rules.md](./product-rules.md) — Reglas de negocio y funnels.
- [roadmap.md](./roadmap.md) — Entregas por fase.
- [setup-local.md](./setup-local.md) — Entorno de desarrollo.
