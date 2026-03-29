# Estado MVP Fase 1

## Slices completados

### ✅ Slice 1: Tenancy / Auth / Accounts / Users / Advisors
- [x] NextAuth.js con credenciales
- [x] Middleware de protección
- [x] Login UI
- [x] Dashboard con stats básicos
- [x] Vistas de accounts, users, advisors (lectura)
- [x] Multi-tenancy (filtrado por accountId)
- [x] Hub admin de configuración de cuenta `/dashboard/account` (S13)
- [x] ABM básico de usuarios por tenant (S15)
- [x] Ajustes generales de cuenta (`name` + `Account.config.timezone`) (S17)

**TODO Fase 2:**
- CRUD completo
- OAuth externo
- Resolución de tenant desde subdomain
- Permisos granulares

### ✅ Slice 2: CRM básico nativo
- [x] Lista de contactos
- [x] Ficha de contacto completa
- [x] Pipeline comercial (vista)
- [x] Tareas, notas, asignación (lectura)
- [x] Propiedades recomendadas
- [x] Consentimientos

**TODO Fase 2:**
- Formularios de edición
- Crear/editar tareas y notas
- Cambiar asignación
- Vista de pipeline (kanban)
- Búsqueda y filtros

### ✅ Slice 3: Contactos y conversaciones
- [x] Endpoint API para crear contactos
- [x] Servicio de creación automática
- [x] Deduplicación básica
- [x] Actualización de estados

**TODO Fase 2:**
- API key por cuenta
- Rate limiting
- Validación más estricta
- Webhooks

### ✅ Slice 4: Inbox unificado
- [x] Vista de todas las conversaciones activas
- [x] Último mensaje por conversación
- [x] Link a ficha de contacto
- [x] Hilo por conversación + asistencia IA + envío manual borrador WhatsApp (S12)
- [x] Filtros por canal y estado en la lista de inbox (S18)
- [x] Búsqueda de texto y paginación en la lista de inbox (S19)

**TODO Fase 2:**
- Filtro por fecha (rango)
- Marcar como leído

### ✅ Slice 5: Perfil declarado
- [x] Vista del perfil de búsqueda
- [x] Actualización de estado conversacional según perfil

**TODO Fase 2:**
- Formulario de edición
- Historial de cambios
- Inferencia automática (IA)

### ✅ Slice 6: Scoring básico
- [x] Cálculo de 4 sub-scores
- [x] Score total ponderado
- [x] Historial de scores
- [x] UI para ver y recalcular

**TODO Fase 2:**
- Pesos configurables
- Reglas más sofisticadas
- ML para ajustar pesos
- Umbrales configurables

### ✅ Slice 7: Seguimiento simple
- [x] Vista de planes de seguimiento
- [x] Vista de secuencias activas
- [x] Próximos intentos
- [x] Cron `/api/cron/follow-up-due` + `processDueFollowUps`; pasos `channel: whatsapp` envían texto (Meta en env)

**TODO Fase 2:**
- Worker con BullMQ (escalado; ver `slice-s06`)
- Envío email u otros canales
- Pausar/reanudar
- Notificaciones

### ✅ Slice 8: Dashboard base
- [x] Stats básicos (counts)
- [x] Links a secciones principales

**TODO Fase 2:**
- Gráficos
- Filtros por fecha
- Comparativas
- Exportación

### ✅ Slice 9: Auditoría básica
- [x] Servicio de auditoría
- [x] Registro de eventos clave
- [x] Vista de eventos (solo admin)

**TODO Fase 2:**
- Más eventos
- Búsqueda y filtros
- Exportación

### ✅ Slice S14: Inventario propiedades (F1-E4)
- [x] API `GET/POST /api/properties`, `GET/PATCH/DELETE /api/properties/[id]`
- [x] Lista y formularios `/dashboard/properties` (new, edit); eliminar con confirmación
- [x] Roles: mutación admin/coordinator; lectura resto

**TODO Fase 2:**
- Importación masiva / fotos

### ✅ Slice S15: Usuarios ABM (F1-E3, parcial)
- [x] API `GET/POST /api/users`, `GET/PATCH/DELETE /api/users/[id]`
- [x] Dashboard `/dashboard/users` con crear/editar/eliminar
- [x] Contraseña hasheada con bcrypt; sin exposición de hash

**TODO Fase 2:**
- Reglas de reasignación al eliminar usuarios vinculados a asesores

### ✅ Slice S16: Asesores ABM (F1-E3)
- [x] API `GET/POST /api/advisors`, `GET/PATCH/DELETE /api/advisors/[id]`
- [x] Dashboard `/dashboard/advisors` con crear/editar/eliminar; unicidad usuario↔asesor

**TODO Fase 2:**
- Flujo guiado de reasignación al eliminar asesor con contactos activos

## Pendiente para MVP completo

### Canales de captura (Fase 1 según PRODUCT_DEFINITION.md)
- [x] Widget web (`kite-lead-widget.js` + `/embed/lead` — ver `docs/capture-integration.md`)
- [x] Patrón landings / proxy (`docs/capture-integration.md`, `docs/examples/`)
- [x] Formularios (`/lead` + API)
- [x] WhatsApp base — **webhook** (`/api/webhooks/whatsapp`, `slice-s08`)
- [x] WhatsApp — **envío** saliente (`POST /api/whatsapp/send`, `slice-s09`)

**Nota:** Estos requieren decisiones de diseño/UX o credenciales externas. Ver `docs/manual-actions-required.md`.

### Motor conversacional
- [x] Integración con proveedor de IA (OpenAI HTTP; `OPENAI_API_KEY`, `slice-s10`)
- [x] Overrides de prompt por cuenta + versionado (`Account.config`, S11–S12)
- [x] Outputs estructurados (`NextConversationAction`; `POST /api/ai/conversation/next-action`)
- [x] Handoff a humano (reglas post-modelo; S11)

**Nota:** API key: `docs/configuracion-manual-paso-a-paso.md` §4.

### Matching y recomendación
- [x] Algoritmo de matching v0 (`PropertyMatch`, reglas sobre inventario `available`)
- [x] Envío de recomendaciones por **WhatsApp** desde ficha contacto (admin/coordinator); modelo `Recommendation` + `sentAt` (S20)

**Nota:** Inventario editable vía S14 (`slice-s14-properties-abm.md`). Otros canales (email, etc.) en Fase 2.

## Datos demo

Usuario de prueba:
- Email: `admin@demo.local`
- Password: `demo123`

Ejecutar: `npm run db:seed`

## Próximos pasos

1. **Instalar dependencias:** `npm install` (desde raíz)
2. **Configurar `.env`:** ver `docs/manual-actions-required.md`
3. **Aplicar migraciones:** `npm run db:migrate:deploy`
4. **Seed:** `npm run db:seed`
5. **Ejecutar:** `npm run dev`
6. **Login:** http://localhost:3000/login

## Decisiones documentadas

- `docs/decisions/slice-1-auth.md`
- `docs/decisions/slice-2-crm.md`
- `docs/decisions/slice-3-9-summary.md`
- `docs/decisions/slice-s14-properties-abm.md`
- `docs/decisions/slice-s15-users-abm.md`
- `docs/decisions/slice-s16-advisors-abm.md`
- `docs/decisions/slice-s17-account-general-config.md`
- `docs/decisions/slice-s18-inbox-filters.md`
- `docs/decisions/slice-s19-inbox-search-pagination.md`
- `docs/decisions/slice-s20-property-recommendation-whatsapp.md`
