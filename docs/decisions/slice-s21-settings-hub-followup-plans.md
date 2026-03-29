# Slice S21 — Centro de configuración + edición de planes de seguimiento

## Contexto

El hub `/dashboard/account` (S13) era mínimo; operadores no encontraban módulos, variables de entorno, endpoints ni dónde ajustar IA o seguimientos. F1-E12 deja planes editables “JSON o UI mínima”; solo existía lectura en `/dashboard/followups` y datos por seed.

## Decisión

- **`/dashboard/account`** pasa a **Centro de configuración** (solo admin): anclas a módulos MVP, tabla de variables de hosting (sin valores), slug del tenant, lista de endpoints con `getPublicAppBaseUrl()` (`AUTH_URL` → `VERCEL_URL` → headers → localhost), sección **Asistente IA** (prompt por cuenta + proveedor por env; sin módulo separado de “idioma”), enlaces a ajustes existentes.
- **`/dashboard/account/follow-up-plans`** lista planes del tenant; **`/[id]`** edita nombre, descripción, intensidad, `maxAttempts`, `status` y **`sequence` JSON** validado con `parsePlanSequence` (mismo contrato que el cron). Auditoría `follow_up_plan_updated`.
- Navegación: etiqueta **Configuración** en dashboard (antes “Cuenta”). `/dashboard/followups` enlaza a edición de planes.

## Pendiente (Fase 2+)

- Alta de planes desde UI; pausar secuencias en bloque al pausar plan; editor visual de pasos; API pública inventario/leads por API key.

## Referencias

- `apps/web/src/app/dashboard/account/page.tsx`
- `apps/web/src/lib/public-base-url.ts`
- `apps/web/src/app/dashboard/account/follow-up-plans/*`
