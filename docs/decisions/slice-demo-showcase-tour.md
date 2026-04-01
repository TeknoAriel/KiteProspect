# Demo showcase (seed) + recorrido dashboard

## Contexto

Hacía falta explorar el producto con **variedad realista** (consultas, canales, inventario, planes de seguimiento por ritmo) sin convertir el CRM en un tutorial pesado.

## Decisión

1. **`packages/db/prisma/seed-demo-showcase.ts`**: función `ensureDemoShowcase` idempotente (marcador `lead01@demo-showcase.local`). Crea **10 propiedades** `[Demo]`, **10 contactos** con emails `*@demo-showcase.local`, conversaciones con canales rotados (`form`, `whatsapp`, `web_widget`, `landing`), mensaje entrante + saliente (simulando respuesta por `web` o `whatsapp`), perfiles de búsqueda, scores, matches, asignación al asesor demo y **6 planes** de seguimiento: **2 × intensidad `low`** (lento), **2 × `medium`**, **2 × `high`** (intenso), con pasos y `delayHours` distintos (incluye paso `instagram` manual en un plan lento). Secuencias con `nextAttemptAt` lejano (~30 días) para no disparar el cron al instante en dev. Transacción Prisma con `timeout: 120000` por volumen.
2. **`prisma/seed.ts`**: siempre asegura cuenta `demo`, admin, asesor y llama `ensureDemoShowcase` (tanto en cuenta nueva como existente).
3. **UI**: `apps/web/src/app/dashboard/dashboard-tour.tsx` — modal de 6 pasos, `localStorage` para “No volver a mostrar”, `sessionStorage` para “Cerrar” en la sesión, botón flotante “Cómo funciona Kite” para reabrir.
4. Tipos de propiedad en seed alineados a `PROPERTY_TYPES` del ABM (`departamento` / `casa` / `terreno`); títulos describen local/comercial/cochera aunque el `type` sea compatible.

## Implementado

- Archivos anteriores; `.gitignore` ya contempla `.env.vercel-production` (cambio previo en repo).

## Pendiente

- Opcional: tour contextual por ruta (más pasos) si el producto lo pide.

## Bloqueado por humano

- Bases ya pobladas antes del merge: ejecutar `npm run db:seed` (o deploy con seed) una vez para materializar el showcase.
