# Reglas de producto

Derivado de **PRODUCT_DEFINITION.md** (fuente de verdad). Las reglas de implementación deben alinearse con este documento.

---

## Qué es y qué no es

### Es

- Plataforma que **transforma consultas** en oportunidades **trabajables, trazables, calificadas y priorizadas**.
- **Multi-tenant** con CRM básico **nativo** (no depende de CRM externo en Fase 1).
- Combinación **IA + reglas de negocio**; la IA no gobierna sola.

### No es

- Chatbot genérico ni FAQ bot.
- CRM enterprise completo en la primera etapa.
- Herramienta de **campañas masivas** ni sistema para **spamear** leads.
- Producto que actualice entidades solo con **texto libre** sin validación / estructura.

---

## Principios no negociables (checklist)

1. **Nunca inventar** propiedades ni disponibilidad: solo datos del inventario (`Property`) y estados reales.
2. **Primero valor, después datos:** no exigir formulario completo antes de una respuesta útil.
3. **Toda acción registrada:** usar `AuditEvent` y trazas por entidad donde aplique.
4. **IA + reglas:** salidas de IA deben pasar por validación y políticas (ver `docs/architecture.md`, capa ai-orchestration).
5. **Seguimiento adaptativo:** no solo “paso 1, paso 2”; considerar score, fatiga, consentimiento, objeción, canal.
6. **Esfuerzo diferenciado:** no todos los leads reciben la misma intensidad ni la misma secuencia.
7. **Configuración comercial:** preferir `Account.config` y plantillas entendibles para el negocio, no solo JSON técnico expuesto al usuario final sin UI.
8. **Funciona sin CRM externo:** el pipeline y la ficha viven en el producto.
9. **Recomendación desde inventario real:** matching contra `Property` con estado válido.
10. **Control humano en cualquier momento:** pausar, escalar o derivar sin quedar atrapado en un flujo automático.

---

## Integración con KiteProp / CRM externo (límites)

- **Kite Prospect** se desarrolla y prueba contra **deployments en Vercel (demo / preview)** hasta acuerdo explícito de **doble aprobación** para un dominio de producción propio.
- **No** usar como referencia por defecto el sitio público de producción de KiteProp (`www.kiteprop.com` y subdominios operativos de la plataforma) en plantillas, variables de ejemplo ni documentación que pueda inducir tráfico o cambios contra ese entorno. La base de API CRM (`KITEPROP_API_URL`) debe ser la **instancia demo/staging** que defina el equipo.
- Los **feeds de inventario** (`Account.config.kitepropFeed`) siguen siendo URLs **por tenant** configuradas por el admin; no sustituyen esta regla sobre documentación y defaults del repo.

Decisión detallada: `docs/decisions/kiteprop-frontera-demo-y-produccion.md`.

---

## Usuarios y roles internos

| Rol | Expectativa |
|-----|-------------|
| **Admin / owner** | Cuenta, usuarios, integraciones, configuración global del tenant. |
| **Coordinador comercial** | Asignación, priorización, supervisión de inbox y pipeline. |
| **Asesor** | Atención humana, tareas, notas, visitas. |

Los valores concretos de `User.role` en BD deben alinearse con estos conceptos (`admin`, `coordinator`, `advisor`).

---

## Funnels (valores canónicos)

### Conversacional (`Contact.conversationalStage`)

Orden lógico aproximado (no siempre estrictamente lineal):

`new` → `answered` → `identified` → `profiled_partial` → `profiled_useful` → `consent_obtained` → `followup_active`

### Comercial (`Contact.commercialStage`)

Incluye: `exploratory`, `prospect`, `real_lead`, `blocked`, `hot`, `assigned`, `visit_scheduled`, `opportunity_active`, `paused`, `lost`, `won`.

**Reglas de uso:**

- Transiciones deben ser **explícitas** en código o reglas documentadas.
- `blocked` / `paused` deben respetar **opt-out** y políticas de consentimiento.

---

## Scoring

Cuatro sub-scores (0–100 cada uno, convención del proyecto):

| Sub-score | En modelo Prisma | Idea |
|-----------|------------------|------|
| Intent | `intentScore` | Intención de compra/alquiler/inversión. |
| Readiness | `readinessScore` | Timeline, urgencia, capacidad de decisión. |
| Fit | `fitScore` | Alineación perfil–inventario. |
| Engagement | `engagementScore` | Respuestas, aperturas, reenganche. |

`totalScore` es combinación **ponderada**; los pesos son **decisión de negocio** (documentar en cuenta o en este archivo cuando se fijen).

**LeadQualification** complementa con `qualified`, `reason`, `criteria`, `source` (`rule` | `ai` | `manual`).

---

## Seguimiento

Debe soportar (a nivel de diseño / Fase 1 mínimo viable donde aplique):

- Secuencias configurables (`FollowUpPlan.sequence` + `FollowUpSequence`).
- Intensidad y máximo de intentos.
- Objetivo por intento (`FollowUpAttempt.objective`).
- Pausas, cierres, reactivación por propiedades nuevas (`reactivateOnNewProperties` + reglas futuras).

**Factores a considerar** (Fase 2+ para lógica rica): score, canal permitido, última interacción, fatiga, consentimiento, objeción, estado del lead, toma manual por asesor.

---

## CRM básico (alcance mínimo)

Por contacto debe poder verse / gestionarse:

- Ficha, historial de conversación y eventos.
- Pipeline (estado comercial).
- Tareas, notas, asignación a asesor.
- Próxima acción (p. ej. derivada de `Task` o reglas).
- Propiedades asociadas / matches / recomendaciones enviadas.
- Consentimientos por canal.

---

## IA

- **Salidas estructuradas** (JSON / schemas); no actualizar entidades parseando texto libre sin validación.
- **Versionar prompts** (código versionado +/o tabla futura; Fase 1 puede ser solo repo).
- **Servicios internos** únicos que llamen al proveedor de IA (ver dominio `ai-orchestration`).

---

## WhatsApp (diseño, no spam)

- Consentimiento y **opt-out** explícitos (`Consent`, flags en contacto si se añaden).
- Tracking de envíos, estados de mensaje, plantillas, coste estimado en metadata si aplica.
- Nunca diseñar bucles de envío agresivo; respetar `maxAttempts`, fatiga y revocación.

---

## Alcance

No implementar ni prometer features que **no** estén en **PRODUCT_DEFINITION.md** sin actualizar primero ese documento.
