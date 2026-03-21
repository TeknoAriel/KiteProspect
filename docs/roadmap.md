# Roadmap y backlog por fases

Alineado con **PRODUCT_DEFINITION.md**. Los ítems son **épicas / entregables**; el orden dentro de cada fase puede ajustarse según dependencias técnicas.

---

## Leyenda

- **E** = Épica
- **D** = Dependencia fuerte de otra épica
- Las integraciones profundas (credenciales, Meta, etc.) se desglosan cuando se aborde el código; aquí solo figuran como hitos.

---

## Fase 1 — MVP

| ID | Épica | Descripción / criterios de aceptación altos |
|----|--------|-----------------------------------------------|
| F1-E1 | **Multi-tenant y auth** | Login de usuarios internos; sesión; todo scoped por `accountId`; roles admin / coordinator / advisor. |
| F1-E2 | **Cuenta y configuración** | CRUD mínimo de `Account`; pantalla de settings que persista en `Account.config` (valores comerciales simples). |
| F1-E3 | **Usuarios y asesores** | Alta/edición/baja lógica de `User` y `Advisor`; asociación advisor↔user opcional. |
| F1-E4 | **Inventario propiedades** | ABM de `Property`; estados `available` / reservado / vendido; validación de no inventar datos en IA. |
| F1-E5 | **Captura: formularios** | API + persistencia que crea `Contact` y `Conversation` (canal `form`); validación y rate limit básico. |
| F1-E6 | **Captura: widget web** | Script embebible + endpoint que abre conversación; mismo modelo que formulario. |
| F1-E7 | **Captura: landing script** | Patrón de integración documentado + endpoint unificado con F1-E5/E6 si aplica. |
| F1-E8 | **Inbox unificado** | Lista de conversaciones por cuenta; vista detalle con `Message`; filtros por canal y estado. |
| F1-E9 | **Motor conversacional base** | Respuestas asistidas con **IA estructurada** + reglas (sin depender de texto libre para mutar entidades); handoff explícito a humano. |
| F1-E10 | **Perfil declarado** | UI/API para completar `SearchProfile` / `declaredProfile`; actualización de `conversationalStage`. |
| F1-E11 | **Score inicial** | Cálculo v1 de los 4 sub-scores + `totalScore`; reglas documentadas en código o config. |
| F1-E12 | **Secuencias simples** | `FollowUpPlan` editable (JSON asistido o UI mínima); ejecución de pasos con **BullMQ** o alternativa acordada; `FollowUpAttempt` registrado. |
| F1-E13 | **CRM básico en UI** | Ficha `Contact`, pipeline comercial, tareas, notas, asignación, próxima acción, consentimientos, recomendaciones enviadas. |
| F1-E14 | **Matching v0** | `PropertyMatch` desde reglas simples contra inventario; sin “inventar” propiedades. |
| F1-E15 | **WhatsApp base** | Webhook + envío básico; `Consent` y opt-out; estados en `Message`; sin lógica agresiva. |
| F1-E16 | **Dashboard base** | KPIs mínimos: leads nuevos, por etapa, conversaciones abiertas (agregados simples). |
| F1-E17 | **Auditoría básica** | Servicio que registre `AuditEvent` en acciones clave (asignación, cambio de etapa, envío masivo individual). |

**Orden sugerido de construcción:** F1-E1 → F1-E2 → F1-E3 → F1-E4 → F1-E5 → F1-E8 → F1-E9 → F1-E10 → F1-E11 → F1-E13 → F1-E14 → F1-E6/E7 → F1-E12 → F1-E15 → F1-E16 → F1-E17.

---

## Fase 2

| ID | Épica | Notas |
|----|--------|------|
| F2-E1 | **Perfil inferido** | IA + reglas; `SearchProfile.source = inferred`, `confidence`. |
| F2-E2 | **Matching mejorado** | Pesos, exclusiones, feedback del usuario en matches. |
| F2-E3 | **Recomendaciones más inteligentes** | Menos ruido, mejor orden, explicación breve (`reason`). |
| F2-E4 | **Reactivación por nuevas propiedades** | Jobs al crear `Property`; respetar consentimiento y fatiga. |
| F2-E5 | **Secuencias adaptativas** | Uso de `triggers`, score, canal, objeción; no solo contador. |
| F2-E6 | **Meta Lead Ads** | Integración captura; `Integration.type` meta. |
| F2-E7 | **Mejores reportes** | Embudos, tiempos de respuesta, conversión por canal. |

---

## Fase 3

| ID | Épica | Notas |
|----|--------|------|
| F3-E1 | **CRM externo** | Sync bidireccional o unidireccional según decisión de negocio. |
| F3-E2 | **APIs públicas documentadas** | OpenAPI o equivalente; API keys por tenant. |
| F3-E3 | **Webhooks públicos** | Eventos de lead, mensaje, asignación. |
| F3-E4 | **Multi-sucursal profundo** | Sub-organizaciones, permisos, reporting por sucursal. |
| F3-E5 | **Más canales** | Email, SMS, etc. según prioridad comercial. |
| F3-E6 | **Reporting avanzado** | Exportaciones, cohortes, atribución. |

---

## Backlog transversal (cualquier fase)

- Tests automatizados en políticas de scoring y matching.
- Observabilidad: logs estructurados, trazas por `accountId` / `contactId`.
- Documentación de runbooks en `docs/` cuando haya despliegue real.

---

## Fuera de alcance explícito (recordatorio)

- CRM enterprise completo en Fase 1.
- Campañas masivas tipo “email blast” sin control por lead.
- Chat genérico sin reglas de negocio inmobiliario.

---

## Referencias

- [product-rules.md](./product-rules.md)
- [architecture.md](./architecture.md)
- [manual-actions-required.md](./manual-actions-required.md)
