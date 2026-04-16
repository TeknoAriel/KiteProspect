# Kite Prospect — Definición del Producto

**Source of truth.** No inventar features fuera de este alcance.

---

## OBJETIVO

Construir una **plataforma de prospección inmobiliaria asistida** (capa de captación, activación, conversación, cualificación, seguimiento, reactivación, sugerencia de propiedades y derivación). No es un CRM enterprise completo; complementa KiteProp u otro CRM o opera en modo liviano con registro y pipeline propios.

Construir, para inmobiliarias, capacidad para:

- capte consultas desde web, landings, formularios y WhatsApp,
- responda con criterio comercial inmobiliario,
- cree un perfil vivo del contacto,
- puntúe intención y calidad del lead,
- ejecute seguimiento configurable e inteligente (intensidades, etapas y ramas documentadas en `docs/core-prospeccion.md`),
- recomiende propiedades relevantes desde inventario real (KiteProp como partner principal vía feeds/integración; sin KiteProp, inventario vía feeds compatibles con el ecosistema, p. ej. Propieya — ver `docs/integracion-kiteprop-propieya.md`),
- derive al humano cuando corresponda,
- registre trazabilidad completa,
- incluya CRM básico nativo si la inmobiliaria no tiene CRM,
- permita integración con CRM externo más adelante.

---

## ESTO NO ES

- no es un chatbot genérico,
- no es un FAQ bot,
- no es un CRM gigante enterprise en la primera etapa,
- no es una herramienta de campañas masivas,
- no es una app dependiente de prompts libres,
- no es un sistema para spamear leads.

---

## TESIS

No quiero un bot que solo responda.
Quiero una plataforma que transforme consultas dispersas en oportunidades comerciales trabajables, trazables, calificadas y priorizadas.

---

## USUARIOS

- inmobiliarias pequeñas sin CRM,
- inmobiliarias medianas con operación manual,
- comercializadoras,
- redes inmobiliarias,
- desarrollistas.

---

## USUARIOS INTERNOS

- admin/owner,
- coordinador comercial,
- asesores.

---

## PRINCIPIOS NO NEGOCIABLES

1. nunca inventar propiedades ni disponibilidad
2. primero dar valor, después pedir datos
3. toda acción debe quedar registrada
4. IA + reglas de negocio, no IA sola
5. seguimiento adaptativo, no solo secuencial
6. no todos los leads reciben el mismo esfuerzo
7. configuración comercial, no técnica
8. debe servir incluso sin CRM externo
9. recomendación basada en inventario real
10. debe poder pausar, escalar o derivar en cualquier momento

---

## FASE 1 — MVP

- multi-tenant
- autenticación
- cuentas
- usuarios
- asesores
- configuración básica por cuenta
- widget web
- script para landings
- formularios
- WhatsApp base
- inbox unificado
- creación automática de contactos
- CRM básico nativo
- perfil declarado
- score inicial
- secuencias simples de seguimiento
- dashboard base
- auditoría básica
- ingesta de inventario desde feeds configurados del tenant (p. ej. export XML/JSON del CRM inmobiliario), sin inventar datos

---

## FASE 2

- perfil inferido
- matching mejorado
- recomendaciones más inteligentes
- reactivación por nuevas propiedades
- secuencias adaptativas
- Meta Lead Ads
- mejores reportes

**Estado de implementación (MVP técnico):** `docs/status-mvp.md` y `docs/decisions/slice-f2-mvp-completion.md`.

---

## FASE 3

- CRM externo
- lectura incremental de leads/consultas desde API CRM (KiteProp) para validación operativa, borradores de respuesta con revisión humana previa al envío (`docs/kiteprop-import-validation-mode.md`)
- APIs
- webhooks públicos
- multi-sucursal más profunda
- más canales
- reporting avanzado

---

## MÓDULOS OBLIGATORIOS

1. tenant / cuentas / configuración
2. captura omnicanal inicial
3. inbox unificado
4. motor conversacional
5. perfilado dinámico
6. matching y recomendación
7. seguimiento inteligente
8. scoring y priorización
9. CRM básico nativo
10. integraciones
11. analítica
12. auditoría

---

## MODELO DE LEAD (Entidades)

- Contact
- Conversation
- Message
- SearchProfile
- LeadQualification
- LeadScore
- FollowUpPlan
- FollowUpSequence
- FollowUpAttempt
- Recommendation
- Property
- PropertyMatch
- Consent
- Task
- Note
- Assignment
- AuditEvent
- Integration
- Account
- User
- Advisor

---

## SCORING

Cuatro sub-scores:

- **Intent Score**
- **Readiness Score**
- **Fit Score**
- **Engagement Score**

---

## FUNNEL

### Conversacional

- new
- answered
- identified
- profiled_partial
- profiled_useful
- consent_obtained
- followup_active

### Comercial

- exploratory
- prospect
- real_lead
- blocked
- hot
- assigned
- visit_scheduled
- opportunity_active
- paused
- lost
- won

---

## SEGUIMIENTO

Debe permitir:

- secuencias configurables,
- intensidad configurable,
- intentos máximos,
- objetivos por intento,
- pausas,
- cierres,
- reactivación por propiedades nuevas compatibles.

No trabajar solo por contador fijo.
También considerar:

- score,
- canal permitido,
- última interacción,
- fatiga,
- consentimiento,
- objeción,
- estado del lead,
- toma manual por asesor.

---

## CRM BÁSICO

Debe incluir:

- ficha de contacto,
- historial,
- pipeline,
- tareas,
- notas,
- asignación,
- próxima acción,
- propiedades asociadas,
- recomendaciones enviadas,
- consentimiento.

---

## ARQUITECTURA RECOMENDADA

- **Frontend:** Next.js
- **Backend:** Node.js + TypeScript
- **DB:** PostgreSQL
- **ORM:** Prisma
- **Jobs/Queues:** Redis + BullMQ
- Arquitectura modular
- Dominios separados:
  - auth/tenancy
  - conversations
  - crm/leads
  - properties
  - matching
  - followups
  - analytics
  - integrations
  - ai-orchestration

---

## IA

- Usar outputs estructurados.
- No depender de texto libre para actualizar entidades.
- Versionar prompts.
- Encapsular la IA detrás de servicios internos claros.

---

## WHATSAPP

Diseñar contemplando:

- consentimiento,
- opt-out,
- tracking de envíos,
- estados de mensajes,
- uso de plantillas,
- costos por mensaje,
- trazabilidad por canal.

No diseñar lógica spammy.

---

## LÍMITE DE ALCANCE

No inventar features fuera de este documento.
