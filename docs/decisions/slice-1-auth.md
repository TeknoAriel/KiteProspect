# Decisiones — Slice 1: Tenancy / Auth / Accounts / Users / Advisors

## Autenticación

**Decisión:** NextAuth.js v5 (Auth.js) con credenciales simples (email/password).

**Razón:**
- Estándar para Next.js 14
- MVP no requiere OAuth externo
- Fácil de extender en Fase 2

**TODO Fase 2:**
- OAuth (Google, etc.) si se requiere
- Resolver `accountId` desde subdomain antes de buscar usuario
- Multi-factor authentication si se requiere

## Multi-tenancy

**Decisión:** Filtrado por `accountId` en todas las queries. `accountId` viene de la sesión.

**Razón:**
- Simplicidad para MVP
- Seguridad: imposible acceder a datos de otra cuenta sin cambiar sesión

**TODO Fase 2:**
- Soporte multi-sucursal más profundo
- Resolución de tenant desde subdomain automática
- Super-admin para ver todas las cuentas (actualmente solo admin puede ver su cuenta)

## Passwords

**Decisión:** bcryptjs con salt rounds 10.

**Razón:**
- Estándar de la industria
- Suficiente para MVP

**TODO Fase 2:**
- Política de contraseñas (longitud, complejidad)
- Reset de contraseña por email
- Cambio de contraseña obligatorio en primer login

## Roles

**Decisión:** Tres roles: `admin`, `coordinator`, `advisor`.

**Razón:**
- Alineado con PRODUCT_DEFINITION.md
- Suficiente para MVP

**Permisos MVP:**
- `admin`: ver todo en su cuenta
- `coordinator`: gestionar usuarios y asesores
- `advisor`: ver contactos asignados

**TODO Fase 2:**
- Permisos granulares por módulo
- Roles personalizables por cuenta

## UI

**Decisión:** HTML/CSS inline simple, sin librería de componentes.

**Razón:**
- MVP: funcionalidad primero
- Sin dependencias adicionales
- Fácil de reemplazar con diseño en Fase 2

**TODO Fase 2:**
- Sistema de diseño (Tailwind, shadcn/ui, etc.)
- Responsive completo
- Accesibilidad (a11y) mejorada

## CRUD

**Decisión:** Solo lectura (vistas) en MVP. Sin formularios de creación/edición.

**Razón:**
- MVP: validar flujo básico primero
- CRUD completo en Fase 2

**TODO Fase 2:**
- Formularios de creación/edición
- Validación de datos
- Confirmaciones de eliminación

## Seed

**Decisión:** Usuario demo: `admin@demo.local` / `demo123`.

**Razón:**
- Desarrollo local rápido
- Sin necesidad de crear usuarios manualmente

**TODO Fase 2:**
- Script de seed más completo
- Varios usuarios de ejemplo con diferentes roles
