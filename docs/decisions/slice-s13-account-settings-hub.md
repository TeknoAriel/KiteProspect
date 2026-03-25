# Decisión: hub de configuración de cuenta (F1-E2 / Sprint S13, MVP parcial)

## Implementado

1. **Ruta** `/dashboard/account` (solo **admin**): lectura de `Account` (nombre, slug, estado, `updatedAt`).
2. **Enlaces** a ajustes existentes que persisten en `Account.config` (p. ej. **IA conversacional** → `/dashboard/account/ai-prompt`, S12).
3. **Navegación:** en el dashboard principal, enlace **Cuenta** reemplaza el enlace directo solo a IA.
4. **IA prompt:** el “volver” apunta al hub de cuenta.

## No incluido (backlog F1-E2 / Fase 2)

- Edición de nombre comercial o slug desde UI.
- Formulario amplio de “configuración comercial” en JSON.
- Roles distintos de admin para editar cuenta.

## Referencias

- `apps/web/src/app/dashboard/account/page.tsx`
- `PRODUCT_DEFINITION.md` — módulo tenant / configuración
