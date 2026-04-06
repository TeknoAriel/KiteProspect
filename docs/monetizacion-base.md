# Base para monetización (planes y límites)

**No** incluye facturación ni pasarela; define **modelo conceptual** y **anclaje en código** para evolucionar sin reescribir el núcleo.

## Planes (concepto)

| Tier | Uso típico |
|------|------------|
| `basic` | Equipo pequeño, volumen acotado |
| `pro` | Operación en crecimiento |
| `advanced` | Más automatización e integraciones |
| `enterprise` | Límites altos, soporte y custom |

Valor en `Account.config.featureFlags.planTier` (opcional). Tipos: `apps/web/src/domains/auth-tenancy/account-plan-capabilities.ts`.

## Capacidades / feature flags (ejemplos)

| Flag | Descripción |
|------|-------------|
| `maxActiveLeads` | Tope de leads activos por cuenta |
| `maxInternalUsers` | Usuarios internos |
| `maxFollowUpPlans` | Plantillas de secuencia |
| `maxChannelsEnabled` | Canales automatizados |
| `advancedScoring` | Reglas de score extendidas |
| `advancedAnalytics` | Reportes avanzados |
| `crmIntegrations` | CRM externos / APIs |
| `smartReactivation` | Reactivación inteligente |
| `autoDerivation` | Derivación automática a asesor |
| `partialWhiteLabel` | Marca blanca parcial |

**Enforcement:** lectura centralizada futura (`extractFeatureFlagsFromAccountConfig`); hoy **no** se bloquea por plan en todos los endpoints — solo diseño estructural.

## Límites operativos posibles

- Contactos / mes, leads activos, seguimientos activos, integraciones, sugerencias por flujo, historial, exportaciones, webhooks/API.

## Billing futuro

Cuando exista suscripción: asociar `customerId` / `subscriptionId` externos al `Account` (o tabla dedicada), mantener límites en `config` o tabla `AccountEntitlements`, y aplicar **gating** en APIs sensibles.

---

**Referencias:** `docs/core-prospeccion.md`, `PRODUCT_DEFINITION.md`.
