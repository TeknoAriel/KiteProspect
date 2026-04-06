# Estados y etiquetas (Latino / técnico)

**Interno:** Prisma mantiene `Contact.conversationalStage` y `Contact.commercialStage` con claves en inglés (estable para migraciones y API).  
**UI:** etiquetas en español en selectores y textos; **badge** de estado operativo unificado en ficha contacto.

## Estados visibles del producto (13)

Lista oficial de lectura humana (badge unificado + mapeo desde etapas técnicas):

| Etiqueta | Notas |
|----------|--------|
| Nuevo | Entrada sin respuesta del lead |
| Contactado | Hubo primer contacto / respuesta |
| En conversación | Diálogo activo |
| Perfil incompleto | Datos parciales |
| Perfil útil | Perfil suficiente para matching |
| En seguimiento | Secuencia o consentimiento activo |
| Con interés | Señal comercial fuerte |
| Calificado | Lead trabajable |
| Bloqueado | Freno explícito (crédito, tercero, etc.) |
| En pausa | Pausa voluntaria / política |
| Reactivable | Perfil guardado para reabrir con motivo |
| Derivado | Mano a asesor / visita |
| Descartado | Cierre sin oportunidad |
| Cerrado | Ganado / fin positivo |

Implementación del badge: `resolveUnifiedOperationalLabel()` en `unified-operational-label.ts`. `REACTIVABLE` puede reforzarse con señales explícitas (tareas, flags) en evoluciones futuras.

## Seguimiento: etapa del núcleo (6)

Distinto del estado comercial del contacto: en secuencias automáticas se muestra **Etapa núcleo (seguimiento)** desde `FollowUpSequence.matrixCoreStageKey` con etiquetas en `FOLLOW_UP_CORE_STAGE_LABEL_ES` (`follow-up-core-stages.ts`).

## Etapas conversacionales (técnico → etiqueta UI)

| Clave | Etiqueta |
|-------|----------|
| `new` | Nuevo |
| `answered` | Contactado |
| `identified` | En conversación |
| `profiled_partial` | Perfil incompleto |
| `profiled_useful` | Perfil útil |
| `consent_obtained` | Consentimiento |
| `followup_active` | En seguimiento |

Fuente: `CONVERSATIONAL_STAGE_LABEL_ES` en `latin-stage-labels.ts`.

## Etapas comerciales (técnico → etiqueta UI)

Fuente: `COMMERCIAL_STAGE_LABEL_ES` en `latin-stage-labels.ts`.

| Clave | Etiqueta |
|-------|----------|
| `exploratory` | Exploratorio |
| `prospect` | Interés / prospecto |
| `real_lead` | Lead real |
| `blocked` | Bloqueado |
| `hot` | Oportunidad caliente |
| `assigned` | Derivado |
| `visit_scheduled` | Visita agendada |
| `opportunity_active` | Oportunidad activa |
| `paused` | En pausa |
| `lost` | Descartado |
| `won` | Cerrado / ganado |

## Vista unificada (badge “operativo”)

Función `resolveUnifiedOperationalLabel()`: prioriza cierre, descarte, pausa, bloqueo, derivación, calor/calificación, luego perfil y conversación.

Etiquetas posibles: `NUEVO`, `CONTACTADO`, `EN CONVERSACIÓN`, `PERFIL INCOMPLETO`, `PERFIL ÚTIL`, `EN SEGUIMIENTO`, `CON INTERÉS`, `CALIFICADO`, `BLOQUEADO`, `EN PAUSA`, `REACTIVABLE`, `DERIVADO`, `DESCARTADO`, `CERRADO`.

## Mapeo orientativo (producto ↔ técnicos)

| Estado deseado (producto) | Aproximación actual |
|---------------------------|---------------------|
| NUEVO | `new` + `exploratory` |
| CONTACTADO | `answered` |
| EN CONVERSACIÓN | `identified` |
| PERFIL INCOMPLETO | `profiled_partial` |
| PERFIL ÚTIL | `profiled_useful` |
| EN SEGUIMIENTO | `followup_active` / `consent_obtained` |
| CON INTERÉS | `hot` / `prospect` |
| CALIFICADO | `real_lead` / `opportunity_active` |
| BLOQUEADO | `blocked` |
| EN PAUSA | `paused` |
| REACTIVABLE | Señal explícita / matriz paso reactivación |
| DERIVADO | `assigned` / `visit_scheduled` |
| DESCARTADO | `lost` |
| CERRADO | `won` |

Una migración futura podría introducir `operationalStage` en BD; el diseño actual evita cambios masivos.
