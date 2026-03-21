# Decisiones — Slices 3-9: Resto del MVP

## Slice 3: Contactos y conversaciones

**Decisión:** Endpoint API básico para crear contactos desde canales externos.

**Razón:**
- MVP: funcionalidad mínima para recibir datos
- Sin autenticación API key (agregar en Fase 2)

**TODO Fase 2:**
- API key por cuenta
- Rate limiting
- Validación más estricta
- Webhooks de confirmación

## Slice 4: Inbox unificado

**Decisión:** Vista simple de todas las conversaciones activas.

**Razón:**
- MVP: validar que se pueden ver conversaciones de todos los canales
- Sin filtros ni búsqueda (Fase 2)

**TODO Fase 2:**
- Filtros por canal, estado, fecha
- Búsqueda de texto
- Paginación
- Marcar como leído/no leído

## Slice 5: Perfil declarado

**Decisión:** Vista de lectura del perfil. Sin formulario de edición.

**Razón:**
- MVP: validar que los datos se muestran
- Edición en Fase 2

**TODO Fase 2:**
- Formulario de edición
- Validación de datos
- Historial de cambios de perfil

## Slice 6: Scoring básico

**Decisión:** Reglas simples y fijas. Pesos hardcodeados.

**Razón:**
- MVP: validar que el cálculo funciona
- Configuración y ML en Fase 2

**Pesos actuales:**
- Intent: 30%
- Readiness: 25%
- Fit: 25%
- Engagement: 20%

**TODO Fase 2:**
- Pesos configurables por cuenta
- Reglas más sofisticadas
- Machine learning para ajustar pesos
- Umbrales configurables

## Slice 7: Seguimiento simple

**Decisión:** Solo vista de lectura. Sin ejecución automática.

**Razón:**
- MVP: validar estructura de datos
- Ejecución automática requiere BullMQ (Fase 2)

**TODO Fase 2:**
- Worker con BullMQ para ejecutar seguimientos
- Programación automática según `nextAttemptAt`
- Pausar/reanudar secuencias
- Notificaciones

## Slice 8: Dashboard base

**Decisión:** Stats básicos (counts). Sin gráficos ni filtros.

**Razón:**
- MVP: validar que se pueden ver métricas básicas
- Visualizaciones en Fase 2

**TODO Fase 2:**
- Gráficos (Chart.js, Recharts, etc.)
- Filtros por fecha
- Comparativas
- Exportación

## Slice 9: Auditoría básica

**Decisión:** Solo registro de eventos clave. Sin búsqueda avanzada.

**Razón:**
- MVP: cumplir principio "toda acción registrada"
- Búsqueda y filtros en Fase 2

**Eventos auditados:**
- Asignación de contactos
- Cambio de estado
- Cálculo de score

**TODO Fase 2:**
- Más eventos (edición, eliminación, etc.)
- Búsqueda por entidad, acción, actor
- Filtros por fecha
- Exportación a CSV/PDF
