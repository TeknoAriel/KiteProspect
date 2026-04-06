# Decisión: alineación del núcleo de prospección (intensidades, etapas, ramas, estados UI)

**Fecha:** 2026-04-01  
**Estado:** Aceptada

## Contexto

El producto se posiciona como **plataforma de prospección inmobiliaria asistida**, no como CRM principal ni chatbot genérico. Se requiere una definición estable de:

- cuatro **intensidades** de seguimiento con límites de contacto como estrategia, no solo conteo;
- seis **etapas** de seguimiento que rijan objetivos del asistente;
- **ramas** automáticas según comportamiento;
- **estados** comprensibles en UI con nomenclatura latina, manteniendo claves técnicas en BD;
- **sugerencia de propiedades** acotada (1–3 temprano, hasta 5 con match fuerte);
- **fuente de inventario:** KiteProp cuando aplique integración; en su defecto coherencia con criterios del ecosistema (p. ej. Propieya vía feed);
- **base** para planes y feature flags sin implementar billing completo.

## Decisión

1. **Matriz oficial por intensidad** (`follow-up-official-matrix.ts`): 4/6/8/10 pasos con etapa del núcleo, objetivo, dato a obtener y pista de siguiente acción; alineada a `docs/seguimiento-y-cualificacion.md`.
2. **Constantes y políticas** en `apps/web/src/domains/core-prospeccion/` (intensidades, normalización legacy, ramas, límites de sugerencias, etiquetas).
3. **Prisma:** `FollowUpSequence.matrixCoreStageKey` / `matrixBranchKey`; `FollowUpPlan.intensity` con default `normal` y claves oficiales; `Contact` sin sustitución masiva de columnas de funnel.
4. **Cron** enriquece cada `FollowUpAttempt` con `metadata.matrix` y rellena `objective` desde la matriz si el paso JSON no lo define.
5. **Motor único** que reordene pasos según datos ya capturados y persista cambios de intensidad por rama **no** está completo; `suggestNextIntensityAfterBranch` es criterio de producto hasta integrarlo al flujo.
6. **Monetización:** tipos y flags en `account-plan-capabilities.ts`; facturación fuera de alcance.

## Consecuencias

- Documentación de producto (`PRODUCT_DEFINITION.md`, `product-rules.md`, `domain-model.md`, `architecture.md`) enlaza a los docs del núcleo.
- Cambios futuros en intensidades/etapas deben actualizar primero `docs/core-prospeccion.md` y el módulo `core-prospeccion`, luego UI/BD si hace falta.

## Referencias

- `docs/core-prospeccion.md`
- `docs/diferencias-vs-implementacion-actual.md`
- `docs/monetizacion-base.md`
