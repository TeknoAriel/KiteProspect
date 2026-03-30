# S24 — Tests matching v0 + fit score + copy dashboard

## Contexto

El roadmap pide tests en políticas de scoring/matching (`docs/roadmap.md` backlog). El dashboard mostraba un mensaje fácil de malinterpretar (“producción atrasada”). El `fitScore` del lead usaba solo el mejor `PropertyMatch`, poco estable si hay varios matches medios.

## Decisión

1. **Vitest** en `@kite-prospect/web` (`vitest run`), archivos `*.test.ts`, `verify` en raíz ejecuta `npm run test` antes del build.
2. **Tests** iniciales: `score-property-match.test.ts` — casos `MATCHING_SCORE_CASES`, propiedad no disponible, perfil inversión.
3. **`calculateFitScore`:** promedio de hasta **3** mejores matches sobre propiedades `available` (antes: solo el primero con umbral 70).
4. **`calculateIntentScore`:** normalización sin acentos + clave `inversion` para alinear con UI/CRM que escriben sin tilde.
5. **`calculateReadinessScore`:** etapas `won`, `paused`, `blocked`, `lost` con puntajes explícitos.
6. **Dashboard:** texto de deploy reescrito como checklist neutral (Deployments / Domains).

## Implementado

- Código y esta decisión; `npm run verify` incluye tests.

## Pendiente

- Más tests (scoring puro extraído a funciones, integración Prisma con mock).
- Reducir warning deprecación CJS de Vite en Vitest al actualizar toolchain.

## Bloqueado por humano

- Ninguno.
