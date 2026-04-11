# Modelo de dominio

Describe **entidades**, **relaciones** y **convenciones** alineadas con `PRODUCT_DEFINITION.md` y `packages/db/prisma/schema.prisma`. Si hay divergencia, prima **PRODUCT_DEFINITION.md** y luego se actualiza Prisma.

---

## Diagrama lógico (texto)

```
Account (tenant)
 ├── User
 ├── Advisor
 ├── CaptureApiKey (F3-E2)
 ├── WebhookSubscription (F3-E3)
 ├── Branch (F3-E4)
 ├── Integration
 ├── FollowUpPlan
 ├── AuditEvent
 ├── Property
 ├── Contact ─────────────────────────────────────────────┐
 │       ├── Conversation → Message                        │
 │       ├── SearchProfile                                 │
 │       ├── LeadScore / LeadQualification                 │
 │       ├── Consent                                       │
 │       ├── Task / Note / Assignment → Advisor           │
 │       ├── PropertyMatch / Recommendation → Property    │
 │       └── FollowUpSequence → FollowUpPlan              │
 │                      └── FollowUpAttempt               │
 └────────────────────────────────────────────────────────┘
```

---

## Entidades principales

### Tenancy y acceso

| Entidad | Descripción |
|---------|-------------|
| **Account** | Inmobiliaria (tenant). `slug` único, `config` JSON para ajustes comerciales. |
| **User** | Usuario interno. `email` + `role` (`admin`, `coordinator`, `advisor`). Pertenece a un `Account`. Único por tenant: `@@unique([accountId, email])`. |
| **Advisor** | Asesor comercial; puede enlazarse a `User` (`userId` opcional). |
| **Integration** | Conexión externa (WhatsApp, CRM, Meta). `type`, `provider`, `config` cifrado en implementación futura. |
| **CaptureApiKey** | Clave `kp_…` por cuenta para `POST /api/contacts/create` (F3-E2); solo hash en BD. |
| **WebhookSubscription** | URL + secreto de firma HMAC + eventos suscritos; webhooks **salientes** (F3-E3 / L14). |
| **Branch** | Sucursal / unidad operativa del tenant; `slug` único por cuenta; contacto opcionalmente enlazado (`Contact.branchId`, L15). |

### Lead / CRM

| Entidad | Descripción |
|---------|-------------|
| **Contact** | Núcleo del lead. Identificadores (`email`, `phone`, `name`), `declaredProfile` JSON (Fase 1), etapas de funnel; `branchId` opcional (F3-E4). |
| **Conversation** | Hilo por canal (`web_widget`, `landing`, `whatsapp`, `form`). Enlaza `Contact` y `Account`. `lastReadAt`: última lectura del hilo por el equipo en inbox (S29). |
| **Message** | Mensaje entrante/saliente; metadata para WhatsApp (estado, plantilla). |
| **Task** | Tarea comercial asociada al contacto. |
| **Note** | Nota libre; `authorId` referencia lógica a usuario/asesor; `updatedAt` para ediciones desde ficha (S27). |
| **Assignment** | Asignación de `Contact` a `Advisor`. |

### Perfil y búsqueda

| Entidad | Descripción |
|---------|-------------|
| **SearchProfile** | Criterios de búsqueda del contacto. `source`: `declared` \| `inferred` (L4: heurísticas sobre mensajes; prioridad **declarado** para matching/scoring). Edición declarada en UI: `/dashboard/contacts/[id]/profile` (S26). |

### Inventario y recomendación

| Entidad | Descripción |
|---------|-------------|
| **Property** | Inmueble del inventario del tenant. **Nunca** inventar fuera de esta tabla. |
| **PropertyMatch** | Relación contacto–propiedad con `score`, `reason`, feedback. Única por par (`contactId`, `propertyId`). |
| **Recommendation** | Envío concreto de una propiedad al contacto por canal. |

### Scoring

| Entidad | Descripción |
|---------|-------------|
| **LeadScore** | Histórico o snapshot por contacto: cuatro sub-scores + `totalScore` + `version`. *Nota:* el schema actual permite múltiples filas por contacto; en implementación se puede decidir “último vigente” por `createdAt` o pasar a `@@unique([contactId])` si se prefiere un solo registro. |
| **LeadQualification** | Resultado cualitativo (`qualified`, `reason`, `criteria`, `source`). |

### Seguimiento

| Entidad | Descripción |
|---------|-------------|
| **FollowUpPlan** | Plantilla de secuencia por cuenta: `sequence` JSON, `maxAttempts`, `intensity`, `triggers`, `reactivateOnNewProperties`. |
| **FollowUpSequence** | Instancia activa para un `Contact` según un `FollowUpPlan`. |
| **FollowUpAttempt** | Cada intento ejecutado (canal, objetivo, resultado). |

### Cumplimiento

| Entidad | Descripción |
|---------|-------------|
| **Consent** | Consentimiento por canal y propósito; `granted` / fechas de revocación. |

### Auditoría

| Entidad | Descripción |
|---------|-------------|
| **AuditEvent** | Trazabilidad: `entityType`, `entityId`, `action`, actor, `changes`. |

---

## Relaciones clave (cardinalidad)

- `Account` **1 — N** `User`, `Advisor`, `Contact`, `Property`, `Conversation`, `Integration`, `FollowUpPlan`, `AuditEvent`, `CaptureApiKey`, `WebhookSubscription`, `Branch`.
- `Branch` **1 — N** `Contact` (opcional por contacto).
- `Contact` **1 — N** `Conversation`, `Message` (vía conversación), `SearchProfile`, `LeadScore`, `LeadQualification`, `Consent`, `Task`, `Note`, `Assignment`, `Recommendation`, `PropertyMatch`, `FollowUpSequence`.
- `Conversation` **1 — N** `Message`.
- `FollowUpPlan` **1 — N** `FollowUpSequence`; `FollowUpSequence` **1 — N** `FollowUpAttempt`.
- `Advisor` **1 — N** `Assignment`.
- `Property` **1 — N** `PropertyMatch`, `Recommendation`.

---

## Campos de funnel (canónicos)

Ver [product-rules.md](./product-rules.md). En BD:

- `Contact.conversationalStage`
- `Contact.commercialStage`

Las **etiquetas en español** para vistas y el **estado operativo unificado** (badge) se documentan en [estados-y-etiquetas.md](./estados-y-etiquetas.md); la lógica de **intensidades, etapas de seguimiento y ramas** en [core-prospeccion.md](./core-prospeccion.md) y [seguimiento-y-cualificacion.md](./seguimiento-y-cualificacion.md).

---

## Convenciones y mejoras futuras (sin bloquear MVP)

| Tema | Recomendación |
|------|----------------|
| Enums | Sustituir strings por enums de Prisma cuando el equipo estabilice valores. |
| `User.email` | `@@unique([accountId, email])` aplicado en el schema. |
| `LeadScore` | Definir si es tabla histórica o un registro por contacto y ajustar constraints. |
| `Note.authorId` | FK opcional a `User` cuando auth esté lista. |
| Cifrado | `Integration.config` y secretos solo vía KMS/env; no en texto plano. |

---

## Referencia rápida Prisma

El archivo fuente de verdad del esquema físico es:

`packages/db/prisma/schema.prisma`

Este documento es la **vista de dominio** para producto y desarrollo.
