# Decisiones — Slice 2: CRM básico nativo

## Alcance MVP

**Decisión:** Solo vistas de lectura (listado y detalle de contactos).

**Razón:**
- Validar flujo básico primero
- CRUD completo en Fase 2
- Evitar complejidad innecesaria

**Incluido:**
- Lista de contactos con información básica
- Ficha de contacto completa con:
  - Información básica
  - Perfil de búsqueda (último)
  - Conversaciones (últimas 10)
  - Score (último)
  - Tareas pendientes
  - Notas (últimas 10)
  - Asignación activa
  - Propiedades recomendadas (top 5)
  - Consentimientos

**TODO Fase 2:**
- Formularios de edición
- Crear/editar tareas
- Crear/editar notas
- Cambiar asignación
- Cambiar estado comercial
- Búsqueda y filtros
- Paginación
- Exportación

## Pipeline comercial

**Decisión:** Mostrar estado (`commercialStage`) pero sin UI de pipeline visual.

**Razón:**
- MVP: información básica suficiente
- Pipeline visual requiere más diseño

**TODO Fase 2:**
- Vista de pipeline (kanban o similar)
- Drag & drop para cambiar estados
- Filtros por etapa

## Tareas y notas

**Decisión:** Solo lectura. Sin formularios de creación.

**Razón:**
- MVP: validar que los datos se muestran correctamente
- Creación/edición en Fase 2

**TODO Fase 2:**
- Formulario de creación de tarea
- Formulario de creación de nota
- Edición y eliminación
- Recordatorios de tareas

## Asignación

**Decisión:** Solo mostrar asignación activa. Sin UI para cambiar.

**Razón:**
- MVP: validar relación Contact ↔ Advisor
- Gestión de asignación en Fase 2

**TODO Fase 2:**
- Formulario de asignación
- Reasignación
- Historial de asignaciones

## Propiedades recomendadas

**Decisión:** Mostrar top 5 por score. Sin acción de envío.

**Razón:**
- MVP: validar matching funciona
- Envío de recomendaciones en Fase 2

**TODO Fase 2:**
- Botón para enviar recomendación
- Historial de recomendaciones enviadas
- Feedback del contacto

## Consentimientos

**Decisión:** Solo lectura. Sin gestión.

**Razón:**
- MVP: validar que se registran
- Gestión en Fase 2 cuando se implemente WhatsApp

**TODO Fase 2:**
- UI para otorgar/revocar consentimiento
- Integración con WhatsApp para opt-out
